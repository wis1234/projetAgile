<?php

namespace App\Services\Quiz;

use App\Models\ParticipationPoint;
use App\Models\Quiz;
use App\Models\QuizApproval;
use App\Models\QuizResult;
use App\Models\User;
use App\Notifications\QuizNotification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;

/**
 * Délibération : chaque responsable (manager) donne son aval en confirmant son mot de passe ProJA.
 * Quand tous les responsables ont donné leur aval sur les résultats actuels, le quiz est « validé »
 * (résultats officiels, correction verrouillée).
 */
class QuizDeliberationService
{
    /**
     * Empreinte des résultats : si une note change après un aval, l'aval devient caduc.
     */
    public function fingerprint(Quiz $quiz): string
    {
        $rows = QuizResult::where('quiz_id', $quiz->id)
            ->orderBy('id')
            ->get(['id', 'score', 'score_exact', 'grading_status'])
            ->map(fn ($r) => $r->id . ':' . number_format($r->exactScore(), 2, '.', '') . ':' . $r->grading_status);

        // Le bonus de participation modifie la note finale : il fait partie de l'empreinte,
        // donc l'ajouter ou le retirer après un aval rend cet aval caduc.
        $bonus = ParticipationPoint::totalsForQuiz($quiz)->sortKeys()
            ->map(fn ($v, $uid) => 'b' . $uid . ':' . number_format($v, 2, '.', ''));

        return sha1($rows->merge($bonus)->implode('|'));
    }

    /** @return array{results:int, pending:int} */
    public function readiness(Quiz $quiz): array
    {
        $base = QuizResult::where('quiz_id', $quiz->id);

        return [
            'results' => (clone $base)->count(),
            'pending' => (clone $base)->where('grading_status', QuizResult::STATUS_PENDING)->count(),
        ];
    }

    public function canOpen(Quiz $quiz): bool
    {
        $r = $this->readiness($quiz);

        return $r['results'] > 0 && $r['pending'] === 0;
    }

    /**
     * État complet de la délibération pour l'interface.
     */
    public function summary(Quiz $quiz, User $viewer): array
    {
        $fingerprint = $this->fingerprint($quiz);
        $approvals = $quiz->approvals()->get()->keyBy('user_id');
        $deciders = $quiz->deciders();

        $people = $deciders->map(function (User $u) use ($approvals, $fingerprint) {
            $approval = $approvals->get($u->id);

            return [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'photo' => $u->profile_photo_url,
                'approved' => $approval && $approval->fingerprint === $fingerprint,
                'stale' => $approval && $approval->fingerprint !== $fingerprint,
                'approved_at' => optional($approval?->approved_at)->toIso8601String(),
            ];
        })->values();

        $isDecider = $deciders->contains('id', $viewer->id);
        $viewerApproved = (bool) optional($people->firstWhere('id', $viewer->id))['approved'];
        $readiness = $this->readiness($quiz);

        return [
            'status' => $quiz->deliberation_status,
            'opened_at' => optional($quiz->deliberation_opened_at)->toIso8601String(),
            'validated_at' => optional($quiz->validated_at)->toIso8601String(),
            'deciders' => $people->all(),
            'approved_count' => $people->where('approved', true)->count(),
            'deciders_count' => $people->count(),
            'is_decider' => $isDecider,
            'viewer_approved' => $viewerApproved,
            'can_open' => $this->canOpen($quiz),
            'can_approve' => $quiz->deliberation_status === Quiz::DELIBERATION_OPEN
                && $isDecider && !$viewerApproved && $readiness['pending'] === 0,
            'pending_copies' => $readiness['pending'],
            'results_count' => $readiness['results'],
        ];
    }

    public function open(Quiz $quiz, User $by): void
    {
        if ($quiz->isValidated()) {
            throw ValidationException::withMessages(['deliberation' => 'Ce quiz est déjà validé.']);
        }

        if (!$this->canOpen($quiz)) {
            throw ValidationException::withMessages([
                'deliberation' => 'La délibération ne peut commencer que lorsque toutes les copies sont corrigées.',
            ]);
        }

        if ($quiz->deliberation_status !== Quiz::DELIBERATION_OPEN) {
            $quiz->update([
                'deliberation_status' => Quiz::DELIBERATION_OPEN,
                'deliberation_opened_at' => now(),
            ]);

            $this->notifyDeciders($quiz, 'deliberation_opened', $by);
        }
    }

    /**
     * Enregistre l'aval d'un responsable après vérification de son mot de passe.
     */
    public function approve(Quiz $quiz, User $user, string $password, Request $request): Quiz
    {
        if ($quiz->deliberation_status !== Quiz::DELIBERATION_OPEN) {
            abort(409, 'La délibération n\'est pas ouverte pour ce quiz.');
        }

        if (!$quiz->deciders()->contains('id', $user->id)) {
            abort(403, 'Seuls les responsables du projet peuvent donner leur aval.');
        }

        if ($this->readiness($quiz)['pending'] > 0) {
            abort(409, 'Des copies restent à corriger.');
        }

        $key = 'quiz-approve:' . $user->id . ':' . $quiz->id;

        if (RateLimiter::tooManyAttempts($key, 5)) {
            throw ValidationException::withMessages([
                'password' => 'Trop de tentatives. Réessayez dans ' . ceil(RateLimiter::availableIn($key) / 60) . ' minute(s).',
            ]);
        }

        if (!$user->password || !Hash::check($password, $user->password)) {
            RateLimiter::hit($key, 600);

            throw ValidationException::withMessages(['password' => 'Mot de passe incorrect.']);
        }

        RateLimiter::clear($key);

        return DB::transaction(function () use ($quiz, $user, $request) {
            $fingerprint = $this->fingerprint($quiz);

            QuizApproval::updateOrCreate(
                ['quiz_id' => $quiz->id, 'user_id' => $user->id],
                [
                    'fingerprint' => $fingerprint,
                    'ip_address' => $request->ip(),
                    'user_agent' => mb_substr((string) $request->userAgent(), 0, 250),
                    'approved_at' => now(),
                ]
            );

            $allApproved = $quiz->deciders()->every(
                fn (User $d) => QuizApproval::where('quiz_id', $quiz->id)
                    ->where('user_id', $d->id)
                    ->where('fingerprint', $fingerprint)
                    ->exists()
            );

            if ($allApproved) {
                $quiz->update([
                    'deliberation_status' => Quiz::DELIBERATION_VALIDATED,
                    'validated_at' => now(),
                    'validated_fingerprint' => $fingerprint,
                ]);

                $this->notifyDeciders($quiz, 'results_validated', $user);
                $this->notifyCandidates($quiz);
            }

            return $quiz->refresh();
        });
    }

    /** Réouverture (admin ou concepteur) : annule tous les avals et rend la correction possible. */
    public function reopen(Quiz $quiz, User $by): void
    {
        $quiz->approvals()->delete();
        $quiz->update([
            'deliberation_status' => Quiz::DELIBERATION_OPEN,
            'validated_at' => null,
            'validated_fingerprint' => null,
        ]);

        $this->notifyDeciders($quiz, 'deliberation_reopened', $by);
    }

    private function notifyDeciders(Quiz $quiz, string $type, User $actor): void
    {
        $payload = [
            'quiz_id' => $quiz->id,
            'quiz_title' => $quiz->title,
            'project_id' => $quiz->project_id,
            'actor_name' => $actor->name,
            'url' => route('projects.quizzes.deliberation', [$quiz->project_id, $quiz->id]),
        ];

        foreach ($quiz->deciders()->where('id', '!=', $actor->id) as $decider) {
            $decider->notify(new QuizNotification($type, $payload));
        }
    }

    private function notifyCandidates(Quiz $quiz): void
    {
        $userIds = QuizResult::where('quiz_id', $quiz->id)->whereNotNull('user_id')->pluck('user_id')->unique();

        User::whereIn('id', $userIds)->get()->each(function (User $candidate) use ($quiz) {
            $candidate->notify(new QuizNotification('results_validated_candidate', [
                'quiz_id' => $quiz->id,
                'quiz_title' => $quiz->title,
                'project_id' => $quiz->project_id,
                'url' => route('projects.quizzes.show', [$quiz->project_id, $quiz->id]),
            ]));
        });
    }
}

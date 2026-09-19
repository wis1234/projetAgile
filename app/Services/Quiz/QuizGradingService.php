<?php

namespace App\Services\Quiz;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizResponse;
use App\Models\QuizResult;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Espace de correction : file d'attente des copies, réservation (verrou) par correcteur
 * pour que plusieurs correcteurs travaillent en parallèle sans se marcher dessus.
 */
class QuizGradingService
{
    public function __construct(private QuizScoringService $scoring)
    {
    }

    /** Copies = tentatives terminées contenant au moins une réponse écrite. */
    public function copiesQuery(Quiz $quiz): Builder
    {
        return QuizAttempt::query()
            ->where('quiz_id', $quiz->id)
            ->where('status', 'completed')
            ->whereHas('responses');
    }

    /**
     * Liste légère de toutes les copies + statistiques d'avancement.
     *
     * @return array{copies:array<int,array>, stats:array}
     */
    public function overview(Quiz $quiz, User $viewer): array
    {
        $attempts = $this->copiesQuery($quiz)
            ->with([
                'user:id,name,profile_photo_path',
                'locker:id,name',
                'responses:id,attempt_id,grading_status,score',
            ])
            ->orderBy('completed_at')
            ->orderBy('id')
            ->get();

        $max = QuizScoringService::writtenMax();

        $copies = $attempts->map(function (QuizAttempt $a) use ($viewer, $max) {
            $total = $a->responses->count();
            $gradedCount = $a->responses->where('grading_status', 'graded')->count();
            $isGraded = $total > 0 && $gradedCount === $total;
            $lockedByOther = !$isGraded && $a->isLockedByOther($viewer->id);

            return [
                'id' => $a->id,
                'reference' => 'C-' . str_pad((string) $a->id, 4, '0', STR_PAD_LEFT),
                'name' => $a->user?->name ?? $a->guest_name ?? 'Candidat externe',
                'photo' => $a->user?->profile_photo_url,
                'is_guest' => $a->user_id === null,
                'status' => $isGraded ? 'graded' : ($lockedByOther ? 'locked' : 'pending'),
                'locked_by' => $lockedByOther ? $a->locker?->name : null,
                'is_mine' => !$isGraded && (int) $a->grading_locked_by === $viewer->id && !$a->isLockedByOther($viewer->id),
                'questions_total' => $total,
                'questions_graded' => $gradedCount,
                'points' => $isGraded ? (float) $a->responses->sum('score') : null,
                'points_max' => $total * $max,
                'submitted_at' => optional($a->completed_at)->toIso8601String(),
                'cheating_count' => is_array($a->cheating_logs) ? count($a->cheating_logs) : 0,
            ];
        })->values();

        $stats = [
            'total' => $copies->count(),
            'graded' => $copies->where('status', 'graded')->count(),
            'pending' => $copies->where('status', '!=', 'graded')->count(),
            'locked' => $copies->where('status', 'locked')->count(),
        ];
        $stats['percent'] = $stats['total'] > 0 ? (int) round($stats['graded'] / $stats['total'] * 100) : 100;

        return ['copies' => $copies->all(), 'stats' => $stats];
    }

    /**
     * Réserve une copie pour le correcteur : celle demandée, sinon la prochaine à corriger
     * (les copies réservées par un autre correcteur sont ignorées).
     *
     * @param array<int,int> $exclude copies que le correcteur a passées
     * @return array{attempt:?QuizAttempt, blocked:?string}
     */
    public function claim(Quiz $quiz, User $user, ?int $attemptId = null, array $exclude = []): array
    {
        return DB::transaction(function () use ($quiz, $user, $attemptId, $exclude) {
            if ($attemptId) {
                $attempt = $this->copiesQuery($quiz)->whereKey($attemptId)->lockForUpdate()->first();

                if (!$attempt) {
                    return ['attempt' => null, 'blocked' => 'not_found'];
                }

                if ($attempt->isLockedByOther($user->id) && !$this->isFullyGraded($attempt)) {
                    return ['attempt' => null, 'blocked' => 'locked'];
                }
            } else {
                $candidates = $this->copiesQuery($quiz)
                    ->whereHas('responses', fn ($q) => $q->where('grading_status', 'pending'))
                    ->when(!empty($exclude), fn ($q) => $q->whereNotIn('id', $exclude))
                    ->orderBy('completed_at')
                    ->orderBy('id')
                    ->lockForUpdate()
                    ->get();

                // 1) une copie que ce correcteur avait déjà réservée, 2) la première copie libre
                $attempt = $candidates->first(fn ($a) => (int) $a->grading_locked_by === $user->id && !$a->isLockedByOther($user->id))
                    ?? $candidates->first(fn ($a) => !$a->isLockedByOther($user->id));
            }

            if ($attempt) {
                $attempt->update([
                    'grading_locked_by' => $user->id,
                    'grading_locked_at' => now(),
                ]);
            }

            return ['attempt' => $attempt, 'blocked' => null];
        });
    }

    /** Libère la copie si elle est réservée par ce correcteur. */
    public function release(QuizAttempt $attempt, User $user): void
    {
        if ((int) $attempt->grading_locked_by === $user->id) {
            $attempt->update(['grading_locked_by' => null, 'grading_locked_at' => null]);
        }
    }

    /** Renouvelle la réservation. Retourne false si la copie a été prise par quelqu'un d'autre. */
    public function heartbeat(QuizAttempt $attempt, User $user): bool
    {
        if ($attempt->isLockedByOther($user->id)) {
            return false;
        }

        $attempt->update(['grading_locked_by' => $user->id, 'grading_locked_at' => now()]);

        return true;
    }

    /**
     * Enregistre les notes de toute une copie, libère le verrou et recalcule le résultat.
     *
     * @param array<int,array{response_id:int,score:int,comment:?string}> $grades
     */
    public function saveCopy(Quiz $quiz, QuizAttempt $attempt, User $grader, array $grades): QuizResult
    {
        if ($quiz->isValidated()) {
            abort(423, 'Les résultats ont été validés en délibération : la correction est verrouillée.');
        }

        return DB::transaction(function () use ($quiz, $attempt, $grader, $grades) {
            $attempt = QuizAttempt::whereKey($attempt->id)->lockForUpdate()->firstOrFail();

            if ($attempt->isLockedByOther($grader->id)) {
                abort(409, 'Cette copie est en cours de correction par ' . ($attempt->locker?->name ?? 'un autre correcteur') . '.');
            }

            $responses = QuizResponse::where('attempt_id', $attempt->id)->get();
            $byResponse = collect($grades)->keyBy(fn ($g) => (int) $g['response_id']);
            $max = QuizScoringService::writtenMax();

            foreach ($responses as $response) {
                $grade = $byResponse->get($response->id);

                if (!$grade || !isset($grade['score'])) {
                    throw ValidationException::withMessages([
                        'grades' => 'Toutes les questions de la copie doivent être notées avant de continuer.',
                    ]);
                }

                $response->update([
                    'score' => max(0, min($max, (int) $grade['score'])),
                    'admin_comments' => filled($grade['comment'] ?? null) ? trim($grade['comment']) : null,
                    'grading_status' => 'graded',
                    'graded_by' => $grader->id,
                ]);
            }

            $attempt->update([
                'graded_at' => now(),
                'grading_locked_by' => null,
                'grading_locked_at' => null,
            ]);

            $result = QuizResult::where('attempt_id', $attempt->id)->firstOrFail();

            return $this->scoring->refreshResult($result);
        });
    }

    public function isFullyGraded(QuizAttempt $attempt): bool
    {
        return !$attempt->responses()->where('grading_status', 'pending')->exists();
    }

    /** Prochaine copie à corriger existe-t-elle (hors copies réservées par d'autres) ? */
    public function hasRemaining(Quiz $quiz, User $user, array $exclude = []): bool
    {
        return $this->copiesQuery($quiz)
            ->whereHas('responses', fn ($q) => $q->where('grading_status', 'pending'))
            ->when(!empty($exclude), fn ($q) => $q->whereNotIn('id', $exclude))
            ->get()
            ->contains(fn ($a) => !$a->isLockedByOther($user->id));
    }
}

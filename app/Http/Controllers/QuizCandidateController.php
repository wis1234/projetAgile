<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizCandidate;
use App\Models\QuizResult;
use App\Models\User;
use App\Notifications\QuizNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * Candidats d'un quiz : des utilisateurs ProJA déjà inscrits, ajoutés par un responsable.
 */
class QuizCandidateController extends Controller
{
    /** Recherche d'utilisateurs à ajouter (nom ou e-mail, 2 caractères minimum). */
    public function search(Request $request, Project $project, Quiz $quiz): JsonResponse
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $term = trim((string) $request->query('q', ''));
        if (mb_strlen($term) < 2) {
            return response()->json(['users' => []]);
        }

        $like = '%' . addcslashes($term, '%_\\') . '%';
        $enrolled = $quiz->candidates()->pluck('user_id');
        $memberIds = $project->users()->pluck('users.id');

        // Seuls les comptes vérifiés peuvent se connecter : inutile de proposer les autres.
        $users = User::query()
            ->whereNotNull('email_verified_at')
            ->whereNotIn('id', $enrolled)
            ->where(fn ($q) => $q->where('name', 'like', $like)->orWhere('email', 'like', $like))
            ->orderBy('name')
            ->limit(10)
            ->get(['id', 'name', 'email', 'profile_photo_path'])
            ->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'photo' => $u->profile_photo_url,
                'is_member' => $memberIds->contains($u->id),
            ]);

        return response()->json(['users' => $users]);
    }

    public function store(Request $request, Project $project, Quiz $quiz)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $data = $request->validate([
            'user_ids' => ['required', 'array', 'min:1', 'max:200'],
            'user_ids.*' => ['integer', 'distinct', Rule::exists('users', 'id')],
        ]);

        return $this->enrol($quiz, $data['user_ids']);
    }

    /** Inscrit d'un coup tous les membres du projet (hors responsables). */
    public function addMembers(Project $project, Quiz $quiz)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $ids = $project->users()
            ->wherePivot('role', '!=', 'manager')
            ->wherePivot('is_muted', false)
            ->pluck('users.id')
            ->all();

        if (! $ids) {
            return back()->with('error', 'Ce projet n\'a aucun membre à ajouter.');
        }

        return $this->enrol($quiz, $ids);
    }

    public function destroy(Project $project, Quiz $quiz, QuizCandidate $candidate)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        // Après une tentative, on garde l'inscription : elle documente l'origine des résultats.
        if (QuizAttempt::where('quiz_id', $quiz->id)->where('user_id', $candidate->user_id)->exists()) {
            return back()->with('error', 'Ce membre a déjà commencé le quiz : il ne peut plus être retiré.');
        }

        $name = $candidate->user?->name ?? 'Candidat';
        $candidate->delete();

        if (function_exists('activity_log')) {
            activity_log('update', "{$name} retiré des membres du quiz '{$quiz->title}'", $quiz);
        }

        return back()->with('success', "{$name} a été retiré des membres du quiz.");
    }

    /** Quiz « réservé aux candidats ajoutés » : les autres membres du projet ne le voient plus. */
    public function restriction(Request $request, Project $project, Quiz $quiz)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $data = $request->validate(['restricted' => ['required', 'boolean']]);
        $quiz->update(['restricted_to_candidates' => (bool) $data['restricted']]);

        return back()->with('success', $quiz->restricted_to_candidates
            ? 'Quiz réservé aux membres du quiz.'
            : 'Quiz ouvert à tous les membres du projet.');
    }

    /** @param list<int> $userIds */
    private function enrol(Quiz $quiz, array $userIds)
    {
        if ($quiz->is_draft) {
            return back()->with('error', 'Publiez d\'abord le quiz avant d\'y ajouter des membres.');
        }

        $already = $quiz->candidates()->pluck('user_id')->all();
        $new = array_values(array_diff($userIds, $already));

        if (! $new) {
            return back()->with('info', 'Ces utilisateurs sont déjà membres de ce quiz.');
        }

        $actor = Auth::user();
        foreach ($new as $userId) {
            QuizCandidate::create(['quiz_id' => $quiz->id, 'user_id' => $userId, 'added_by' => $actor->id]);
        }

        $this->notify($quiz, $new, $actor);

        if (function_exists('activity_log')) {
            activity_log('create', count($new) . " membre(s) ajouté(s) au quiz '{$quiz->title}' par {$actor->name}", $quiz);
        }

        return back()->with('success', count($new) . ' membre(s) ajouté(s) au quiz.');
    }

    /** @param list<int> $userIds */
    private function notify(Quiz $quiz, array $userIds, User $actor): void
    {
        try {
            $url = route('projects.quizzes.show', [$quiz->project_id, $quiz->id]);

            User::whereIn('id', $userIds)->get()->each(fn (User $u) => $u->notify(new QuizNotification('quiz_assigned', [
                'quiz_id' => $quiz->id,
                'project_id' => $quiz->project_id,
                'quiz_title' => $quiz->title,
                'actor_name' => $actor->name,
                'url' => $url,
            ])));
        } catch (\Throwable $e) {
            // Une notification ne doit jamais empêcher l'inscription.
            Log::warning('Quiz assignment notification failed: ' . $e->getMessage());
        }
    }

    /**
     * Liste des candidats avec leur avancement (pour la page détail, responsables uniquement).
     *
     * @return list<array<string, mixed>>
     */
    public static function roster(Quiz $quiz): array
    {
        $candidates = $quiz->candidates()->with(['user:id,name,email,profile_photo_path', 'adder:id,name'])->get();
        $userIds = $candidates->pluck('user_id');

        $attempts = QuizAttempt::where('quiz_id', $quiz->id)->whereIn('user_id', $userIds)
            ->get(['id', 'user_id', 'status'])->groupBy('user_id');

        $results = QuizResult::where('quiz_id', $quiz->id)->whereIn('user_id', $userIds)
            ->orderByDesc('score_exact')->orderByDesc('score')->get()->groupBy('user_id')->map->first();

        return $candidates->map(function (QuizCandidate $c) use ($attempts, $results) {
            $mine = $attempts->get($c->user_id, collect());
            $result = $results->get($c->user_id);

            $status = match (true) {
                $result && $result->is_pending => 'pending',
                (bool) $result => 'completed',
                $mine->contains('status', 'in_progress') => 'in_progress',
                default => 'not_started',
            };

            return [
                'id' => $c->id,
                'user_id' => $c->user_id,
                'name' => $c->user?->name ?? 'Utilisateur supprimé',
                'email' => $c->user?->email,
                'photo' => $c->user?->profile_photo_url,
                'added_by' => $c->adder?->name,
                'added_at' => $c->created_at?->toIso8601String(),
                'status' => $status,
                'score' => $result?->exactScore(),
                'locked' => $mine->isNotEmpty(), // a déjà commencé : ne peut plus être retiré
            ];
        })->sortBy('name')->values()->all();
    }
}

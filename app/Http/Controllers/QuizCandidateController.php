<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizCandidate;
use App\Models\QuizResult;
use App\Models\User;
use App\Notifications\QuizNotification;
use App\Services\Quiz\CandidateEmailExtractor;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;

/**
 * Candidats d'un quiz : des utilisateurs ProJA déjà inscrits, ajoutés par un responsable.
 */
class QuizCandidateController extends Controller
{
    /** Taille maximale d'un fichier d'import (en Ko). */
    private const IMPORT_MAX_KB = 5120;

    /** Extensions acceptées pour l'import de fichier. */
    private const IMPORT_EXTENSIONS = ['xlsx', 'xls', 'csv', 'txt'];

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

    /**
     * Liste paginée et cherchable des membres du projet éligibles (ni responsables, ni déjà
     * membres du quiz), pour l'import en masse avec exclusion manuelle côté interface.
     */
    public function importable(Request $request, Project $project, Quiz $quiz): JsonResponse
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $term = trim((string) $request->query('q', ''));
        $perPage = min(50, max(5, (int) $request->query('per_page', 20)));

        $already = $quiz->candidates()->pluck('user_id');

        $query = $project->users()
            ->wherePivot('role', '!=', 'manager')
            ->wherePivot('is_muted', false)
            ->whereNotIn('users.id', $already)
            ->when($term !== '', function ($q) use ($term) {
                $like = '%' . addcslashes($term, '%_\\') . '%';
                $q->where(fn ($w) => $w->where('name', 'like', $like)->orWhere('email', 'like', $like));
            })
            ->orderBy('name');

        $page = $query->paginate($perPage, ['users.id', 'name', 'email', 'profile_photo_path'], 'page')
            ->withQueryString();

        return response()->json([
            'data' => collect($page->items())->map(fn (User $u) => [
                'id' => $u->id,
                'name' => $u->name,
                'email' => $u->email,
                'photo' => $u->profile_photo_url,
            ]),
            'current_page' => $page->currentPage(),
            'last_page' => $page->lastPage(),
            'per_page' => $page->perPage(),
            // Total réellement éligible (hors responsables, hors déjà-membres, hors filtre courant) :
            // sert à afficher « Tout sélectionner (N) » sans devoir charger toutes les pages.
            'total' => $page->total(),
        ]);
    }

    /**
     * Inscrit en masse les membres éligibles du projet (hors responsables, hors muets, hors déjà
     * membres), à l'exception de ceux explicitement décochés dans l'interface d'import.
     *
     * @param  list<int>  $exceptUserIds  Identifiants décochés par le responsable avant l'import.
     */
    public function addMembers(Request $request, Project $project, Quiz $quiz)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $data = $request->validate([
            'except_user_ids' => ['sometimes', 'array'],
            'except_user_ids.*' => ['integer'],
        ]);
        $except = $data['except_user_ids'] ?? [];

        $ids = $project->users()
            ->wherePivot('role', '!=', 'manager')
            ->wherePivot('is_muted', false)
            ->when($except, fn ($q) => $q->whereNotIn('users.id', $except))
            ->pluck('users.id')
            ->all();

        if (! $ids) {
            return back()->with('error', 'Aucun membre à ajouter : soit le projet n\'en a pas, soit tous ont été exclus ou sont déjà membres du quiz.');
        }

        return $this->enrol($quiz, $ids);
    }

    /**
     * Import par fichier Excel / CSV : la colonne « email » est détectée automatiquement
     * (voir CandidateEmailExtractor) et les utilisateurs ProJA dont l'e-mail correspond sont
     * ajoutés d'office au quiz.
     *
     * Répond en JSON avec un compte rendu détaillé : ajoutés, déjà membres, introuvables,
     * comptes non vérifiés, responsables du projet (ignorés) et valeurs invalides.
     */
    public function importExcel(Request $request, Project $project, Quiz $quiz, CandidateEmailExtractor $extractor): JsonResponse
    {
        $this->authorize('manage', [Quiz::class, $project]);

        if ($quiz->is_draft) {
            return response()->json(['message' => 'Publiez d\'abord le quiz avant d\'y ajouter des membres.'], 422);
        }

        $request->validate([
            'file' => [
                'bail', 'required', 'file', 'max:' . self::IMPORT_MAX_KB,
                function (string $attribute, mixed $file, \Closure $fail) {
                    // L'extension déclarée suffit ici : le contenu réel est vérifié à la lecture.
                    if (! in_array(strtolower($file->getClientOriginalExtension()), self::IMPORT_EXTENSIONS, true)) {
                        $fail('Format non pris en charge : utilisez un fichier .xlsx, .xls ou .csv.');
                    }
                },
            ],
        ], [
            'file.required' => 'Sélectionnez un fichier à importer.',
            'file.file' => 'Le fichier envoyé est invalide.',
            'file.max' => 'Le fichier est trop volumineux (' . (self::IMPORT_MAX_KB / 1024) . ' Mo maximum).',
        ]);

        try {
            $parsed = $extractor->extract($request->file('file'));
        } catch (\DomainException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }

        $emails = $parsed['emails'];

        // Correspondance insensible à la casse, par lots pour rester sous la limite de paramètres SQL.
        $users = collect();
        foreach (array_chunk($emails, 500) as $chunk) {
            $users = $users->concat(
                User::query()
                    ->whereIn(DB::raw('LOWER(email)'), $chunk)
                    ->get(['id', 'name', 'email', 'email_verified_at'])
            );
        }
        $byEmail = $users->keyBy(fn (User $u) => mb_strtolower($u->email));

        $managerIds = $project->users()->wherePivot('role', 'manager')->pluck('users.id')->all();
        $enrolled = array_flip($quiz->candidates()->pluck('user_id')->all());

        $toAdd = [];
        $already = $notFound = $unverified = $managers = [];

        foreach ($emails as $email) {
            $user = $byEmail->get($email);

            if (! $user) {
                $notFound[] = $email;
            } elseif (! $user->email_verified_at) {
                // Cohérent avec la recherche : un compte non vérifié ne peut pas se connecter.
                $unverified[] = $email;
            } elseif (in_array($user->id, $managerIds, true)) {
                $managers[] = $email;
            } elseif (isset($enrolled[$user->id])) {
                $already[] = $email;
            } else {
                $toAdd[$user->id] = ['name' => $user->name, 'email' => $user->email];
            }
        }

        if ($toAdd) {
            $this->attach($quiz, array_keys($toAdd), $request->user(), 'import de fichier');
        }

        return response()->json([
            'source' => Arr::only($parsed, ['sheet', 'sheets', 'column', 'header', 'detected_by', 'truncated']),
            'summary' => [
                'rows' => $parsed['rows'],
                'emails' => count($emails),
                'added' => count($toAdd),
                'already' => count($already),
                'not_found' => count($notFound),
                'unverified' => count($unverified),
                'managers' => count($managers),
                'invalid' => $parsed['invalid_count'],
                'duplicates' => $parsed['duplicates'],
            ],
            'added' => array_values($toAdd),
            'not_found' => $notFound,
            'unverified' => $unverified,
            'managers' => $managers,
            'invalid' => $parsed['invalid'],
        ]);
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

        $requested = count(array_unique($userIds));
        $already = $quiz->candidates()->pluck('user_id')->all();
        $new = array_values(array_diff($userIds, $already));
        $skipped = $requested - count($new);

        if (! $new) {
            return back()->with('info', $requested > 1
                ? "Ces {$requested} utilisateurs étaient déjà membres de ce quiz : personne n'a été ajouté."
                : 'Cet utilisateur est déjà membre de ce quiz.');
        }

        $this->attach($quiz, $new, Auth::user());

        // Message explicite : combien ont vraiment été ajoutés, combien étaient déjà membres
        // (ignorés sans erreur — l'import peut continuer sereinement).
        $message = count($new) . ' membre(s) ajouté(s) au quiz.';
        if ($skipped > 0) {
            $message .= " {$skipped} étaient déjà membres et ont été ignorés — vous pouvez continuer.";
        }

        return back()->with('success', $message)->with('import_summary', [
            'added' => count($new),
            'skipped' => $skipped,
            'requested' => $requested,
        ]);
    }

    /**
     * Inscrit les utilisateurs au quiz (atomique et idempotent), les notifie et journalise l'action.
     * Point d'entrée commun à l'ajout manuel, à l'import de membres du projet et à l'import de fichier.
     *
     * @param  list<int>  $userIds  Identifiants pas encore inscrits.
     * @param  string|null  $origin  Précision pour le journal d'activité (ex. « import de fichier »).
     */
    private function attach(Quiz $quiz, array $userIds, User $actor, ?string $origin = null): void
    {
        DB::transaction(function () use ($quiz, $userIds, $actor) {
            foreach ($userIds as $userId) {
                // firstOrCreate : une inscription simultanée ne fait pas échouer tout le lot.
                QuizCandidate::firstOrCreate(
                    ['quiz_id' => $quiz->id, 'user_id' => $userId],
                    ['added_by' => $actor->id]
                );
            }
        });

        $this->notify($quiz, $userIds, $actor);

        if (function_exists('activity_log')) {
            $suffix = $origin ? " ({$origin})" : '';
            activity_log('create', count($userIds) . " membre(s) ajouté(s) au quiz '{$quiz->title}' par {$actor->name}{$suffix}", $quiz);
        }
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

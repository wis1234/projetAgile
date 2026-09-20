<?php

namespace App\Http\Controllers;

use App\Http\Requests\DraftQuizRequest;
use App\Http\Requests\StoreQuizRequest;
use App\Http\Requests\UpdateQuizRequest;
use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizCumul;
use App\Models\QuizResponse;
use App\Models\QuizResult;
use App\Http\Controllers\QuizCandidateController;
use App\Services\Quiz\QuizBuilderService;
use App\Services\Quiz\QuizDeliberationService;
use App\Services\Quiz\QuizScoringService;
use App\Services\Quiz\QuizSubmissionService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class QuizController extends Controller
{
    public function __construct(
        private QuizBuilderService $builder,
        private QuizScoringService $scoring,
        private QuizSubmissionService $submission,
        private QuizDeliberationService $deliberation,
    ) {
    }

    private function projectSummary(Project $project): array
    {
        return ['id' => $project->id, 'name' => $project->name];
    }

    public function index(Project $project)
    {
        $this->authorize('viewAny', [Quiz::class, $project]);

        $userId = Auth::id();
        $canManage = $project->userCanManageQuizzes(Auth::user());

        $quizzes = Quiz::where('project_id', $project->id)
            ->visibleForUser(Auth::user(), $canManage)
            ->withCount([
                'questions',
                'attempts',
                'attempts as user_attempts_count' => fn ($q) => $q->where('user_id', $userId),
                'results as pending_results_count' => fn ($q) => $q->where('grading_status', QuizResult::STATUS_PENDING),
            ])
            ->with([
                'creator:id,name',
                'results' => fn ($q) => $q->where('user_id', $userId)->orderByDesc('completed_at')->orderByDesc('id'),
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Quiz $quiz) use ($canManage) {
                $userResult = $quiz->results->first();

                return [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'quiz_type' => $quiz->quiz_type,
                    'duration_minutes' => $quiz->duration_minutes,
                    'max_attempts' => $quiz->max_attempts,
                    'is_active' => $quiz->is_active,
                    'is_draft' => $quiz->is_draft,
                    'show_results' => $quiz->show_results,
                    'public_token' => $canManage ? $quiz->public_token : null,
                    'allow_public_access' => $quiz->allow_public_access,
                    'deliberation_status' => $quiz->deliberation_status,
                    'created_at' => $quiz->created_at,
                    'creator' => $quiz->creator ? ['id' => $quiz->creator->id, 'name' => $quiz->creator->name] : null,
                    'questions_count' => $quiz->questions_count,
                    'attempts_count' => $quiz->attempts_count,
                    'pending_copies_count' => $canManage ? $quiz->pending_results_count : null,
                    'user_attempts_count' => $quiz->user_attempts_count,
                    'user_latest_score' => $userResult?->score,
                    'user_latest_pending' => (bool) $userResult?->is_pending,
                    'user_has_completed' => (bool) $userResult,
                ];
            });

        return Inertia::render('Quizzes/Index', [
            'project' => $this->projectSummary($project),
            'quizzes' => $quizzes,
            'cumuls' => $canManage ? $this->cumulCards($project) : [],
            'canManage' => $canManage,
        ]);
    }

    /**
     * Cartes « quiz cumulés » : aperçu visuel des quiz regroupés.
     */
    private function cumulCards(Project $project): array
    {
        return QuizCumul::where('project_id', $project->id)
            ->with(['items.quiz:id,title,quiz_type,deliberation_status', 'creator:id,name'])
            ->latest()
            ->get()
            ->map(function (QuizCumul $cumul) {
                $quizIds = $cumul->items->pluck('quiz_id');
                $candidates = QuizResult::whereIn('quiz_id', $quizIds)
                    ->get(['user_id', 'guest_email'])
                    ->unique(fn ($r) => $r->candidateKey())
                    ->count();

                return [
                    'id' => $cumul->id,
                    'title' => $cumul->title,
                    'description' => $cumul->description,
                    'missing_policy' => $cumul->missing_policy,
                    'include_bonus' => $cumul->include_bonus,
                    'created_at' => $cumul->created_at,
                    'creator' => $cumul->creator?->name,
                    'candidates_count' => $candidates,
                    'quizzes' => $cumul->items->map(fn ($i) => [
                        'id' => $i->quiz_id,
                        'title' => $i->quiz?->title ?? 'Quiz supprimé',
                        'quiz_type' => $i->quiz?->quiz_type,
                        'coefficient' => $i->coefficient,
                        'validated' => $i->quiz?->deliberation_status === Quiz::DELIBERATION_VALIDATED,
                    ])->values(),
                ];
            })
            ->all();
    }

    public function create(Project $project)
    {
        $this->authorize('create', [Quiz::class, $project]);

        return Inertia::render('Quizzes/Create', [
            'project' => $this->projectSummary($project),
        ]);
    }

    /**
     * Brouillon : permet d'enregistrer une question dès sa création, avant le quiz complet.
     */
    public function draft(DraftQuizRequest $request, Project $project)
    {
        $this->authorize('create', [Quiz::class, $project]);

        $v = $request->validated();

        $quiz = Quiz::create([
            'project_id' => $project->id,
            'created_by' => Auth::id(),
            'title' => $v['title'],
            'description' => $v['description'] ?? null,
            'quiz_type' => Quiz::TYPE_QCM,
            'duration_minutes' => $v['duration_minutes'],
            'max_attempts' => $v['max_attempts'],
            'is_active' => false,
            'is_draft' => true,
            'show_results' => $v['show_results'] ?? true,
        ]);

        return response()->json(['quiz' => ['id' => $quiz->id, 'is_draft' => true]], 201);
    }

    public function store(StoreQuizRequest $request, Project $project)
    {
        $this->authorize('create', [Quiz::class, $project]);

        $v = $request->validated();

        $quiz = DB::transaction(function () use ($v, $project) {
            $quiz = Quiz::create([
                'project_id' => $project->id,
                'created_by' => Auth::id(),
                'title' => $v['title'],
                'description' => $v['description'] ?? null,
                'quiz_type' => Quiz::TYPE_QCM,
                'duration_minutes' => $v['duration_minutes'],
                'max_attempts' => $v['max_attempts'],
                'is_active' => $v['is_active'] ?? true,
                'is_draft' => false,
                'show_results' => $v['show_results'] ?? true,
            ]);

            $this->builder->syncQuestions($quiz, $v['questions']);

            return $quiz;
        });

        if (function_exists('activity_log')) {
            activity_log('create', "Quiz '{$quiz->title}' créé par " . Auth::user()->name, $quiz);
        }

        return redirect()->route('projects.quizzes.index', $project->id)
            ->with('success', 'Quiz créé avec succès !');
    }

    public function edit(Project $project, Quiz $quiz)
    {
        $this->authorize('update', [$quiz, $project]);

        $quiz->load('questions');

        return Inertia::render('Quizzes/Edit', [
            'project' => $this->projectSummary($project),
            'quiz' => $quiz,
            'structureLocked' => $this->builder->locked($quiz),
            'validated' => $quiz->isValidated(),
        ]);
    }

    public function update(UpdateQuizRequest $request, Project $project, Quiz $quiz)
    {
        $this->authorize('update', [$quiz, $project]);

        $v = $request->validated();
        $wasDraft = $quiz->is_draft;

        $this->builder->assertEditable($quiz);

        DB::transaction(function () use ($v, $quiz) {
            $quiz->update([
                'title' => $v['title'],
                'description' => $v['description'] ?? null,
                'duration_minutes' => $v['duration_minutes'],
                'max_attempts' => $v['max_attempts'],
                'is_active' => $v['is_active'] ?? true,
                'is_draft' => false,
                'show_results' => $v['show_results'] ?? true,
            ]);

            $this->builder->syncQuestions($quiz, $v['questions']);
        });

        if (function_exists('activity_log')) {
            activity_log('update', "Quiz '{$quiz->title}' mis à jour", $quiz);
        }

        if ($wasDraft) {
            return redirect()->route('projects.quizzes.index', $project->id)
                ->with('success', 'Quiz enregistré et publié avec succès !');
        }

        return redirect()->route('projects.quizzes.show', [$project->id, $quiz->id])
            ->with('success', 'Quiz mis à jour avec succès !');
    }

    public function destroy(Project $project, Quiz $quiz)
    {
        $this->authorize('delete', [$quiz, $project]);

        $title = $quiz->title;
        $cumulIds = $quiz->cumulItems()->pluck('quiz_cumul_id');

        $quiz->delete();

        // Un cumul qui n'a plus aucun quiz n'a plus de sens.
        if ($cumulIds->isNotEmpty()) {
            QuizCumul::whereIn('id', $cumulIds)->doesntHave('items')->delete();
        }

        if (function_exists('activity_log')) {
            activity_log('delete', "Quiz '{$title}' supprimé", $project);
        }

        return redirect()->route('projects.quizzes.index', $project->id)
            ->with('success', 'Quiz supprimé avec succès !');
    }

    public function show(Project $project, Quiz $quiz)
    {
        $this->authorize('view', [$quiz, $project]);

        $user = Auth::user();
        $canManage = $project->userCanManageQuizzes($user);

        $quiz->loadCount('questions');
        if (!$canManage) {
            $quiz->makeHidden(['public_token']);
        }

        $attemptsCount = QuizAttempt::where('quiz_id', $quiz->id)->where('user_id', $user->id)->count();

        $activeAttempt = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->first();

        $latestResult = QuizResult::where('quiz_id', $quiz->id)
            ->where(fn ($q) => $q->where('user_id', $user->id)
                ->orWhere(fn ($q) => $q->whereNull('user_id')->where('guest_email', $user->email)))
            ->orderByDesc('completed_at')
            ->orderByDesc('id')
            ->first();

        // Les responsables du projet (ceux qui décident) : photos visibles de tous les membres.
        $deciders = $quiz->deciders()->map(fn ($u) => [
            'id' => $u->id,
            'name' => $u->name,
            'photo' => $u->profile_photo_url,
        ])->values();

        $props = [
            'project' => $this->projectSummary($project),
            'quiz' => $quiz,
            'attemptsCount' => $attemptsCount,
            'hasActiveAttempt' => (bool) $activeAttempt,
            'activeAttemptId' => $activeAttempt?->id,
            'latestResult' => $latestResult,
            'canManage' => $canManage,
            'deciders' => $deciders,
            'cheatingAttemptsCount' => 0,
            'evaluation' => null,
            'candidates' => [],
            // Le classement nominatif n'est pas ouvert aux candidats extérieurs au projet.
            'canViewRanking' => $canManage || ($quiz->show_results && $project->isMember($user)),
            'isProjectMember' => $project->isMember($user),
        ];

        if ($canManage) {
            $props['candidates'] = QuizCandidateController::roster($quiz);
            $results = QuizResult::where('quiz_id', $quiz->id);
            $resultsCount = (clone $results)->count();
            $pendingCount = (clone $results)->where('grading_status', QuizResult::STATUS_PENDING)->count();

            $props['cheatingAttemptsCount'] = QuizAttempt::where('quiz_id', $quiz->id)
                ->whereNotNull('cheating_logs')
                ->get(['id', 'cheating_logs'])
                ->filter(fn ($a) => is_array($a->cheating_logs) && count($a->cheating_logs) > 0)
                ->count();

            $props['evaluation'] = [
                'participants' => $resultsCount,
                'pending_copies' => $pendingCount,
                'has_written' => $quiz->questions()->where('question_type', 'written')->exists(),
                'deliberation' => $this->deliberation->summary($quiz, $user),
                'is_creator_or_admin' => $user->hasRole('admin') || $quiz->created_by === $user->id,
            ];
        }

        return Inertia::render('Quizzes/Show', $props);
    }

    public function launch(Project $project, Quiz $quiz)
    {
        $this->authorize('launch', [$quiz, $project]);

        $user = Auth::user();

        $attempt = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->where('status', 'in_progress')
            ->first();

        if (!$attempt) {
            $completedAttempts = QuizAttempt::where('quiz_id', $quiz->id)
                ->where('user_id', $user->id)
                ->where('status', 'completed')
                ->count();

            if ($completedAttempts >= $quiz->max_attempts) {
                return redirect()->route('projects.quizzes.show', [$project->id, $quiz->id])
                    ->with('error', 'Vous avez atteint le nombre maximum de tentatives pour ce quiz.');
            }

            $attempt = QuizAttempt::create([
                'quiz_id' => $quiz->id,
                'user_id' => $user->id,
                'answers' => [],
                'status' => 'in_progress',
                'started_at' => now(),
            ]);
        }

        // Les bonnes réponses ne sont jamais envoyées au navigateur du candidat.
        $questions = $quiz->questions()->get()->map(fn ($q) => [
            'id' => $q->id,
            'question_text' => $q->question_text,
            'question_type' => $q->question_type,
            'option_a' => $q->option_a,
            'option_b' => $q->option_b,
            'option_c' => $q->option_c,
            'option_d' => $q->option_d,
            'order' => $q->order,
        ]);

        return Inertia::render('Quizzes/Take', [
            'project' => $this->projectSummary($project),
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'duration_minutes' => $quiz->duration_minutes,
                'quiz_type' => $quiz->quiz_type,
            ],
            'questions' => $questions,
            'attempt' => [
                'id' => $attempt->id,
                'started_at' => $attempt->started_at->toIso8601String(),
                'answers' => $attempt->answers ?? (object) [],
                'cheating_logs' => $attempt->cheating_logs ?? [],
            ],
        ]);
    }

    public function submit(Request $request, Project $project, Quiz $quiz)
    {
        $this->authorize('view', [$quiz, $project]);

        $validated = $request->validate([
            'attempt_id' => 'required|exists:quiz_attempts,id',
            'answers' => 'nullable|array',
            'cheating_logs' => 'nullable|array',
        ]);

        $user = Auth::user();
        $attempt = QuizAttempt::where('id', $validated['attempt_id'])
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($attempt->status === 'completed') {
            return redirect()->route('projects.quizzes.results', [$project->id, $quiz->id]);
        }

        $result = $this->submission->finalize($quiz, $attempt, $validated['answers'] ?? [], $validated['cheating_logs'] ?? null);

        if (function_exists('activity_log')) {
            $cheatingCount = count($validated['cheating_logs'] ?? $attempt->cheating_logs ?? []);
            $cheatingMsg = $cheatingCount > 0 ? " (ALERTE TRICHE: {$cheatingCount} incident(s) détecté(s))" : '';
            $scoreLabel = $result->is_pending ? 'en attente de correction' : "Score: {$result->score}%";
            activity_log('create', "Quiz '{$quiz->title}' terminé par " . $user->name . " ({$scoreLabel}){$cheatingMsg}", $quiz);
        }

        if ($quiz->show_results) {
            return redirect()->route('projects.quizzes.results', [$project->id, $quiz->id])
                ->with('success', 'Quiz soumis avec succès !')
                ->with('attempt_id', $attempt->id);
        }

        return redirect()->route('projects.quizzes.show', [$project->id, $quiz->id])
            ->with('success', 'Vos réponses ont été enregistrées.');
    }

    public function results(Project $project, Quiz $quiz)
    {
        $this->authorize('viewResults', [$quiz, $project]);

        $user = Auth::user();
        $isManager = $project->userCanManageQuizzes($user);

        $attemptId = request()->input('attempt_id') ?? session('attempt_id');

        if ($attemptId) {
            $result = QuizResult::where('quiz_id', $quiz->id)
                ->where('attempt_id', $attemptId)
                ->when(!$isManager, fn ($q) => $q->where('user_id', $user->id))
                ->firstOrFail();
        } else {
            $targetUserId = ($isManager && request()->has('user_id')) ? request()->input('user_id') : $user->id;

            $result = QuizResult::where('quiz_id', $quiz->id)
                ->where('user_id', $targetUserId)
                ->orderByDesc('completed_at')
                ->orderByDesc('id')
                ->firstOrFail();
        }

        $attempt = QuizAttempt::findOrFail($result->attempt_id);
        $questions = $quiz->questions()->get();
        $responses = QuizResponse::where('attempt_id', $attempt->id)->get();

        if (!$isManager) {
            $quiz->makeHidden(['public_token']);
        }

        return Inertia::render('Quizzes/Results', [
            'project' => $this->projectSummary($project),
            'quiz' => $quiz,
            'result' => $result,
            'attempt' => $attempt->makeHidden($isManager ? [] : ['cheating_logs']),
            'questions' => $questions,
            'responses' => $responses,
            'candidate' => [
                'id' => $result->user_id,
                'name' => $result->user?->name ?? $result->guest_name ?? 'Utilisateur',
            ],
            'canGrade' => $isManager && !$quiz->isValidated(),
            'validated' => $quiz->isValidated(),
        ]);
    }

    public function ranking(Project $project, Quiz $quiz)
    {
        $this->authorize('view', [$quiz, $project]);

        $canManage = $project->userCanManageQuizzes(Auth::user());

        // Les membres ne voient le classement que si les résultats leur sont ouverts.
        abort_if(!$canManage && !$quiz->show_results, 403, 'Les résultats de ce quiz ne sont pas publics.');
        // Un candidat extérieur au projet ne voit pas les noms et notes des autres candidats.
        abort_if(!$canManage && !$project->isMember(Auth::user()), 403, 'Le classement est réservé aux membres du projet.');

        $final = $this->scoring->finalResults($quiz, $canManage);

        if (!$canManage) {
            $quiz->makeHidden(['public_token']);
        }

        return Inertia::render('Quizzes/Ranking', [
            'project' => $this->projectSummary($project),
            'quiz' => $quiz,
            'rankings' => $final['rows'],
            'stats' => $final['stats'],
            'canManage' => $canManage,
            'validated' => $quiz->isValidated(),
        ]);
    }

    /**
     * Notation d'une seule réponse depuis la page de résultats d'une copie.
     * (L'espace de correction reste l'outil principal pour corriger toutes les copies.)
     */
    public function gradeResponse(Request $request, Project $project, Quiz $quiz, QuizResponse $response)
    {
        $this->authorize('grade', [Quiz::class, $project]);

        if ($quiz->isValidated()) {
            return back()->with('error', 'Les résultats sont validés : la correction est verrouillée.');
        }

        $validated = $request->validate([
            'score' => 'required|integer|min:0|max:' . QuizScoringService::writtenMax(),
            'admin_comments' => 'nullable|string',
        ]);

        $response->update([
            'score' => $validated['score'],
            'admin_comments' => $validated['admin_comments'] ?? null,
            'grading_status' => 'graded',
            'graded_by' => Auth::id(),
        ]);

        $result = QuizResult::where('attempt_id', $response->attempt_id)->first();

        if ($result) {
            $result = $this->scoring->refreshResult($result);

            if (!$result->is_pending) {
                QuizAttempt::whereKey($response->attempt_id)->update(['graded_at' => now()]);
            }
        }

        return back()->with('success', 'Note enregistrée avec succès !');
    }

    public function togglePublicLink(Request $request, Project $project, Quiz $quiz)
    {
        $this->authorize('update', [$quiz, $project]);

        if (!$quiz->public_token) {
            $quiz->public_token = \Illuminate\Support\Str::random(32);
        }

        $quiz->allow_public_access = !$quiz->allow_public_access;
        $quiz->save();

        $status = $quiz->allow_public_access ? 'activé' : 'désactivé';

        return back()->with('success', "Accès par lien public {$status} avec succès !");
    }

    public function cheatingLogs(Project $project, Quiz $quiz)
    {
        $this->authorize('view', [$quiz, $project]);

        if (!$project->userCanManageQuizzes(Auth::user())) {
            abort(403, 'Accès non autorisé');
        }

        $attempts = QuizAttempt::where('quiz_id', $quiz->id)
            ->whereNotNull('cheating_logs')
            ->with('user:id,name,email,profile_photo_path')
            ->orderByDesc('updated_at')
            ->get()
            ->filter(fn ($a) => is_array($a->cheating_logs) && count($a->cheating_logs) > 0)
            ->map(fn ($a) => [
                'id' => $a->id,
                'user_id' => $a->user_id,
                'guest_name' => $a->guest_name,
                'guest_email' => $a->guest_email,
                'user_name' => $a->user?->name ?? $a->guest_name ?? 'Candidat externe',
                'user_email' => $a->user?->email ?? $a->guest_email ?? 'Non spécifié',
                'user_photo' => $a->user?->profile_photo_path,
                'status' => $a->status,
                'started_at' => $a->started_at,
                'completed_at' => $a->completed_at,
                'cheating_logs' => $a->cheating_logs,
                'cheating_count' => count($a->cheating_logs),
            ])
            ->values();

        return Inertia::render('Quizzes/CheatingLogs', [
            'project' => $this->projectSummary($project),
            'quiz' => $quiz,
            'attempts' => $attempts,
        ]);
    }
}

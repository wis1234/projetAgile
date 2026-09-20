<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizCandidate;
use App\Models\QuizResult;
use App\Services\Quiz\QuizAccessService;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Rubrique « Quiz » du menu : tous les quiz de l'utilisateur, quel que soit le projet.
 * Un candidat (compte sans projet) n'a que cette rubrique.
 */
class MyQuizzesController extends Controller
{
    public function index(QuizAccessService $access)
    {
        $user = Auth::user();
        $isAdmin = $user->hasRole('admin');
        $managed = $isAdmin ? null : $access->managedProjectIds($user);

        $quizzes = $access->visibleQuizzes($user)
            ->with('project:id,name')
            ->withCount(['questions'])
            ->orderByDesc('created_at')
            ->get();

        $ids = $quizzes->pluck('id');

        $attempts = QuizAttempt::whereIn('quiz_id', $ids)->where('user_id', $user->id)
            ->get(['id', 'quiz_id', 'status'])
            ->groupBy('quiz_id');

        $latestResults = QuizResult::whereIn('quiz_id', $ids)->where('user_id', $user->id)
            ->orderByDesc('completed_at')->orderByDesc('id')
            ->get()
            ->groupBy('quiz_id')
            ->map->first();

        $enrolled = QuizCandidate::where('user_id', $user->id)->pluck('quiz_id')->flip();

        $pending = QuizResult::whereIn('quiz_id', $ids)
            ->where('grading_status', QuizResult::STATUS_PENDING)
            ->selectRaw('quiz_id, COUNT(*) as c')->groupBy('quiz_id')->pluck('c', 'quiz_id');

        $items = $quizzes->map(function (Quiz $quiz) use ($attempts, $latestResults, $enrolled, $pending, $isAdmin, $managed) {
            $mine = $attempts->get($quiz->id, collect());
            $completed = $mine->where('status', 'completed')->count();
            $active = $mine->firstWhere('status', 'in_progress');
            $latest = $latestResults->get($quiz->id);
            $canManage = $isAdmin || in_array($quiz->project_id, $managed ?? [], true);

            $status = match (true) {
                $quiz->is_draft => 'draft',
                (bool) $active => 'in_progress',
                $completed >= $quiz->max_attempts && $completed > 0 => 'completed',
                $quiz->isValidated() => $completed > 0 ? 'completed' : 'closed',
                ! $quiz->is_active => 'inactive',
                $completed > 0 => 'retake',
                default => 'to_take',
            };

            return [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'quiz_type' => $quiz->quiz_type,
                'duration_minutes' => $quiz->duration_minutes,
                'max_attempts' => $quiz->max_attempts,
                'questions_count' => $quiz->questions_count,
                'project' => ['id' => $quiz->project?->id, 'name' => $quiz->project?->name],
                'status' => $status,
                'attempts_done' => $completed,
                'score' => $latest?->exactScore(),
                'score_pending' => (bool) $latest?->is_pending,
                'show_results' => $quiz->show_results,
                'validated' => $quiz->isValidated(),
                'is_draft' => $quiz->is_draft,
                'invited' => $enrolled->has($quiz->id),
                'restricted' => $quiz->restricted_to_candidates,
                'can_manage' => $canManage,
                'pending_copies' => $canManage ? ($pending[$quiz->id] ?? 0) : 0,
                'created_at' => $quiz->created_at,
            ];
        })->values();

        return Inertia::render('Quizzes/MyQuizzes', [
            'quizzes' => $items,
            'candidateOnly' => $user->isQuizCandidateOnly(),
        ]);
    }
}

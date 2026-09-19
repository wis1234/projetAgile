<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizResult;
use App\Services\Quiz\QuizGradingService;
use App\Services\Quiz\QuizScoringService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

/**
 * Espace de correction des copies (questions écrites).
 */
class QuizGradingController extends Controller
{
    public function __construct(private QuizGradingService $grading)
    {
    }

    /** @return array<int,int> */
    private function excluded(Request $request): array
    {
        return array_values(array_unique(array_map('intval', (array) $request->input('exclude', []))));
    }

    public function index(Request $request, Project $project, Quiz $quiz)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $user = Auth::user();
        $exclude = $this->excluded($request);
        $readOnly = $quiz->isValidated();

        $claim = ['attempt' => null, 'blocked' => null];

        if ($readOnly) {
            // Quiz validé : consultation seulement, aucune réservation de copie.
            $requested = $request->integer('attempt') ?: null;
            $claim['attempt'] = $requested ? $this->grading->copiesQuery($quiz)->whereKey($requested)->first() : null;
        } else {
            $claim = $this->grading->claim($quiz, $user, $request->integer('attempt') ?: null, $exclude);
        }

        // La vue d'ensemble est calculée APRÈS la réservation pour refléter « ma copie en cours ».
        $overview = $this->grading->overview($quiz, $user);

        $remaining = $overview['stats']['pending'];
        $noCopyClaimed = !$claim['attempt'] && !$claim['blocked'] && !$readOnly && $remaining > 0;
        $waitingOthers = $noCopyClaimed && $overview['stats']['locked'] > 0;
        $skippedAll = $noCopyClaimed && !$waitingOthers && !empty($exclude);

        return Inertia::render('Quizzes/Grading', [
            'project' => ['id' => $project->id, 'name' => $project->name],
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'deliberation_status' => $quiz->deliberation_status,
            ],
            'copies' => $overview['copies'],
            'stats' => $overview['stats'],
            'current' => $claim['attempt'] ? $this->presentCopy($quiz, $claim['attempt']) : null,
            'blocked' => $claim['blocked'],
            'exclude' => $exclude,
            'allDone' => !$readOnly && $remaining === 0,
            'waitingOthers' => $waitingOthers,
            'skippedAll' => $skippedAll,
            'readOnly' => $readOnly,
            'maxScore' => QuizScoringService::writtenMax(),
            'lockTtl' => (int) config('quiz.lock_ttl_minutes', 10),
        ]);
    }

    /**
     * Enregistre toute la copie puis enchaîne automatiquement sur la suivante.
     */
    public function save(Request $request, Project $project, Quiz $quiz, QuizAttempt $attempt)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $validated = $request->validate([
            'grades' => ['required', 'array', 'min:1'],
            'grades.*.response_id' => ['required', 'integer'],
            'grades.*.score' => ['required', 'integer', 'min:0', 'max:' . QuizScoringService::writtenMax()],
            'grades.*.comment' => ['nullable', 'string', 'max:2000'],
            'exclude' => ['nullable', 'array'],
        ]);

        $result = $this->grading->saveCopy($quiz, $attempt, Auth::user(), $validated['grades']);

        $name = $attempt->user?->name ?? $attempt->guest_name ?? 'le candidat';

        if (function_exists('activity_log')) {
            activity_log('update', "Copie de {$name} corrigée pour le quiz '{$quiz->title}' (" . ($result->is_pending ? 'partielle' : $result->score . '%') . ')', $quiz);
        }

        return redirect()
            ->route('projects.quizzes.grading', [$project->id, $quiz->id, 'exclude' => $this->excluded($request)])
            ->with('success', "Copie de {$name} enregistrée.");
    }

    /** « Passer » : libère la copie et passe à la suivante (la copie passée n'est plus proposée à ce correcteur pour cette session). */
    public function release(Request $request, Project $project, Quiz $quiz, QuizAttempt $attempt)
    {
        $this->authorize('manage', [Quiz::class, $project]);

        $this->grading->release($attempt, Auth::user());

        // Appel « fire and forget » (fermeture de page) : pas de redirection nécessaire.
        if ($request->expectsJson() && !$request->header('X-Inertia')) {
            return response()->json(['ok' => true]);
        }

        $exclude = $this->excluded($request);
        if ($request->boolean('skip')) {
            $exclude[] = $attempt->id;
        }

        return redirect()->route('projects.quizzes.grading', [$project->id, $quiz->id, 'exclude' => array_values(array_unique($exclude))]);
    }

    public function heartbeat(Project $project, Quiz $quiz, QuizAttempt $attempt): JsonResponse
    {
        $this->authorize('manage', [Quiz::class, $project]);

        if ($quiz->isValidated() || !$this->grading->heartbeat($attempt, Auth::user())) {
            return response()->json(['ok' => false], 409);
        }

        return response()->json(['ok' => true]);
    }

    private function presentCopy(Quiz $quiz, QuizAttempt $attempt): array
    {
        $attempt->load(['user:id,name,email,profile_photo_path', 'responses']);

        $questions = $quiz->questions()->get();
        $byId = $questions->keyBy('id');

        $responses = $attempt->responses
            ->sortBy(fn ($r) => $byId->get($r->question_id)?->order ?? 0)
            ->values()
            ->map(function ($r) use ($byId, $questions) {
                $q = $byId->get($r->question_id);
                $text = (string) $r->answer_text;

                return [
                    'id' => $r->id,
                    'question_number' => $q ? $questions->search(fn ($x) => $x->id === $q->id) + 1 : null,
                    'question_text' => $q?->question_text ?? 'Question supprimée',
                    'answer_text' => $text,
                    'word_count' => $text === '' ? 0 : str_word_count(strip_tags($text), 0, 'àâäéèêëîïôöùûüçÀÂÄÉÈÊËÎÏÔÖÙÛÜÇ'),
                    'score' => $r->grading_status === 'graded' ? $r->score : null,
                    'comment' => $r->admin_comments,
                    'status' => $r->grading_status,
                ];
            });

        $result = QuizResult::where('attempt_id', $attempt->id)->first();
        $qcmTotal = $questions->where('question_type', 'qcm')->count();

        return [
            'id' => $attempt->id,
            'reference' => 'C-' . str_pad((string) $attempt->id, 4, '0', STR_PAD_LEFT),
            'candidate' => [
                'name' => $attempt->user?->name ?? $attempt->guest_name ?? 'Candidat externe',
                'email' => $attempt->user?->email ?? $attempt->guest_email,
                'photo' => $attempt->user?->profile_photo_url,
                'is_guest' => $attempt->user_id === null,
            ],
            'submitted_at' => optional($attempt->completed_at)->toIso8601String(),
            'duration_minutes' => ($attempt->started_at && $attempt->completed_at)
                ? max(1, (int) round($attempt->started_at->diffInMinutes($attempt->completed_at)))
                : null,
            'cheating_count' => is_array($attempt->cheating_logs) ? count($attempt->cheating_logs) : 0,
            'qcm' => $qcmTotal > 0 ? ['correct' => (int) ($result?->correct_answers ?? 0), 'total' => $qcmTotal] : null,
            'responses' => $responses->all(),
            'already_graded' => $responses->isNotEmpty() && $responses->every(fn ($r) => $r['status'] === 'graded'),
        ];
    }
}

<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreQuizRequest;
use App\Http\Requests\UpdateQuizRequest;
use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\QuizResponse;
use App\Models\QuizResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class QuizController extends Controller
{
    public function index(Project $project)
    {
        $this->authorize('viewAny', [Quiz::class, $project]);

        $quizzes = Quiz::where('project_id', $project->id)
            ->withCount(['questions', 'attempts'])
            ->with(['creator', 'results' => function ($q) {
                $q->where('user_id', Auth::id())->orderBy('completed_at', 'desc');
            }])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($quiz) {
                $userResult = $quiz->results->first();
                $userAttemptsCount = QuizAttempt::where('quiz_id', $quiz->id)
                    ->where('user_id', Auth::id())
                    ->count();

                return [
                    'id' => $quiz->id,
                    'title' => $quiz->title,
                    'description' => $quiz->description,
                    'quiz_type' => $quiz->quiz_type,
                    'duration_minutes' => $quiz->duration_minutes,
                    'max_attempts' => $quiz->max_attempts,
                    'is_active' => $quiz->is_active,
                    'show_results' => $quiz->show_results,
                    'public_token' => $quiz->public_token,
                    'allow_public_access' => $quiz->allow_public_access,
                    'created_at' => $quiz->created_at,
                    'creator' => $quiz->creator ? [
                        'id' => $quiz->creator->id,
                        'name' => $quiz->creator->name,
                    ] : null,
                    'questions_count' => $quiz->questions_count,
                    'attempts_count' => $quiz->attempts_count,
                    'user_attempts_count' => $userAttemptsCount,
                    'user_latest_score' => $userResult ? $userResult->score : null,
                    'user_has_completed' => $userResult ? true : false,
                ];
            });

        $userRole = $project->users()->where('user_id', Auth::id())->first()?->pivot->role;

        return Inertia::render('Quizzes/Index', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
            ],
            'quizzes' => $quizzes,
            'canManage' => Auth::user()->hasRole('admin') || $userRole === 'manager',
        ]);
    }

    public function create(Project $project)
    {
        $this->authorize('create', [Quiz::class, $project]);

        return Inertia::render('Quizzes/Create', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
            ],
        ]);
    }

    public function store(StoreQuizRequest $request, Project $project)
    {
        $this->authorize('create', [Quiz::class, $project]);

        $validated = $request->validated();

        DB::transaction(function () use ($validated, $project, &$quiz) {
            $quiz = Quiz::create([
                'project_id' => $project->id,
                'created_by' => Auth::id(),
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'quiz_type' => $validated['quiz_type'],
                'duration_minutes' => $validated['duration_minutes'],
                'max_attempts' => $validated['max_attempts'],
                'is_active' => $validated['is_active'] ?? true,
                'show_results' => $validated['show_results'] ?? true,
            ]);

            foreach ($validated['questions'] as $index => $q) {
                QuizQuestion::create([
                    'quiz_id' => $quiz->id,
                    'question_text' => $q['question_text'],
                    'question_type' => $q['question_type'],
                    'option_a' => $q['option_a'] ?? null,
                    'option_b' => $q['option_b'] ?? null,
                    'option_c' => $q['option_c'] ?? null,
                    'option_d' => $q['option_d'] ?? null,
                    'correct_answer' => isset($q['correct_answer']) ? (int) $q['correct_answer'] : null,
                    'order' => $index + 1,
                ]);
            }
        });

        if (function_exists('activity_log')) {
            activity_log('create', 'Création de quiz', $quiz, "Quiz '{$quiz->title}' créé par " . Auth::user()->name);
        }

        return redirect()->route('projects.quizzes.index', $project->id)
            ->with('success', 'Quiz créé avec succès !');
    }

    public function edit(Project $project, Quiz $quiz)
    {
        $this->authorize('update', [$quiz, $project]);

        $quiz->load('questions');

        return Inertia::render('Quizzes/Edit', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
            ],
            'quiz' => $quiz,
        ]);
    }

    public function update(UpdateQuizRequest $request, Project $project, Quiz $quiz)
    {
        $this->authorize('update', [$quiz, $project]);

        $validated = $request->validated();

        DB::transaction(function () use ($validated, $quiz) {
            $quiz->update([
                'title' => $validated['title'],
                'description' => $validated['description'] ?? null,
                'quiz_type' => $validated['quiz_type'],
                'duration_minutes' => $validated['duration_minutes'],
                'max_attempts' => $validated['max_attempts'],
                'is_active' => $validated['is_active'] ?? true,
                'show_results' => $validated['show_results'] ?? true,
            ]);

            // Re-sync questions
            $quiz->questions()->delete();

            foreach ($validated['questions'] as $index => $q) {
                QuizQuestion::create([
                    'quiz_id' => $quiz->id,
                    'question_text' => $q['question_text'],
                    'question_type' => $q['question_type'],
                    'option_a' => $q['option_a'] ?? null,
                    'option_b' => $q['option_b'] ?? null,
                    'option_c' => $q['option_c'] ?? null,
                    'option_d' => $q['option_d'] ?? null,
                    'correct_answer' => isset($q['correct_answer']) ? (int) $q['correct_answer'] : null,
                    'order' => $index + 1,
                ]);
            }
        });

        if (function_exists('activity_log')) {
            activity_log('update', 'Modification de quiz', $quiz, "Quiz '{$quiz->title}' mis à jour");
        }

        return redirect()->route('projects.quizzes.index', $project->id)
            ->with('success', 'Quiz mis à jour avec succès !');
    }

    public function destroy(Project $project, Quiz $quiz)
    {
        $this->authorize('delete', [$quiz, $project]);

        $title = $quiz->title;
        $quiz->delete();

        if (function_exists('activity_log')) {
            activity_log('delete', 'Suppression de quiz', $project, "Quiz '{$title}' supprimé");
        }

        return redirect()->route('projects.quizzes.index', $project->id)
            ->with('success', 'Quiz supprimé avec succès !');
    }

    public function show(Project $project, Quiz $quiz)
    {
        $this->authorize('view', [$quiz, $project]);

        $quiz->loadCount('questions');

        $attemptsCount = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', Auth::id())
            ->count();

        $activeAttempt = QuizAttempt::where('quiz_id', $quiz->id)
            ->where('user_id', Auth::id())
            ->where('status', 'in_progress')
            ->first();

        $latestResult = QuizResult::where('quiz_id', $quiz->id)
            ->where(function ($query) {
                $query->where('user_id', Auth::id())
                      ->orWhere(function ($query) {
                          $query->whereNull('user_id')
                                ->where('guest_email', Auth::user()->email);
                      });
            })
            ->orderBy('completed_at', 'desc')
            ->first();

        $userRole = $project->users()->where('user_id', Auth::id())->first()?->pivot->role;

        return Inertia::render('Quizzes/Show', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
            ],
            'quiz' => $quiz,
            'attemptsCount' => $attemptsCount,
            'hasActiveAttempt' => (bool) $activeAttempt,
            'activeAttemptId' => $activeAttempt?->id,
            'latestResult' => $latestResult,
            'canManage' => Auth::user()->hasRole('admin') || $userRole === 'manager',
        ]);
    }

    public function launch(Project $project, Quiz $quiz)
    {
        $this->authorize('launch', [$quiz, $project]);

        $user = Auth::user();

        // Check if there is an active in_progress attempt
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

        // Questions without exposing correct_answer to prevent client side cheating
        $questions = $quiz->questions()->get()->map(function ($q) {
            return [
                'id' => $q->id,
                'question_text' => $q->question_text,
                'question_type' => $q->question_type,
                'option_a' => $q->option_a,
                'option_b' => $q->option_b,
                'option_c' => $q->option_c,
                'option_d' => $q->option_d,
                'order' => $q->order,
            ];
        });

        return Inertia::render('Quizzes/Take', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
            ],
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
                'answers' => $attempt->answers ?? (object)[],
            ],
        ]);
    }

    public function submit(Request $request, Project $project, Quiz $quiz)
    {
        $this->authorize('view', [$quiz, $project]);

        $validated = $request->validate([
            'attempt_id' => 'required|exists:quiz_attempts,id',
            'answers' => 'nullable|array',
        ]);

        $user = Auth::user();
        $attempt = QuizAttempt::where('id', $validated['attempt_id'])
            ->where('quiz_id', $quiz->id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        if ($attempt->status === 'completed') {
            return redirect()->route('projects.quizzes.results', [$project->id, $quiz->id]);
        }

        $answers = $validated['answers'] ?? [];
        $questions = $quiz->questions()->get();

        $qcmTotal = $questions->where('question_type', 'qcm')->count();
        $writtenTotal = $questions->where('question_type', 'written')->count();
        $qcmEarned = 0;

        foreach ($questions as $q) {
            $val = $answers[$q->id] ?? null;

            if ($q->question_type === 'written') {
                QuizResponse::updateOrCreate(
                    [
                        'quiz_id' => $quiz->id,
                        'question_id' => $q->id,
                        'attempt_id' => $attempt->id,
                        'user_id' => $user->id,
                    ],
                    [
                        'answer_text' => is_string($val) ? $val : '',
                        'grading_status' => 'pending',
                        'score' => 0,
                    ]
                );
            } else if ($q->question_type === 'qcm') {
                if ($val !== null && (int)$val === (int)$q->correct_answer) {
                    $qcmEarned++;
                }
            }
        }

        $qcmScore = $qcmTotal > 0 ? ($qcmEarned / $qcmTotal) * 100 : 0;
        $finalScore = $qcmScore;

        if ($qcmTotal > 0 && $writtenTotal > 0) {
            // Mixed quiz: QCM represents 50% initial score before manual grading
            $finalScore = $qcmScore / 2;
        }

        $attempt->update([
            'answers' => $answers,
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $result = QuizResult::create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'attempt_id' => $attempt->id,
            'score' => (int) round($finalScore),
            'correct_answers' => $qcmEarned,
            'total_questions' => $questions->count(),
        ]);

        if (function_exists('activity_log')) {
            activity_log('create', 'Soumission de quiz', $quiz, "Quiz '{$quiz->title}' terminé par " . $user->name . " (Score: {$result->score}%)");
        }

        if ($quiz->show_results) {
            return redirect()->route('projects.quizzes.results', [$project->id, $quiz->id])
                ->with('success', 'Quiz soumis avec succès !');
        }

        return redirect()->route('projects.quizzes.show', [$project->id, $quiz->id])
            ->with('success', 'Vos réponses ont été enregistrées.');
    }

    public function results(Project $project, Quiz $quiz)
    {
        $this->authorize('viewResults', [$quiz, $project]);

        $user = Auth::user();

        // If user is manager or admin, allow passing user_id param to view specific user results
        $targetUserId = $user->id;
        $userRole = $project->users()->where('user_id', $user->id)->first()?->pivot->role;
        $isManager = $user->hasRole('admin') || $userRole === 'manager';

        if ($isManager && request()->has('attempt_id')) {
            $result = QuizResult::where('quiz_id', $quiz->id)
                ->where('attempt_id', request()->input('attempt_id'))
                ->firstOrFail();
        } else {
            if ($isManager && request()->has('user_id')) {
                $targetUserId = request()->input('user_id');
            }

            $result = QuizResult::where('quiz_id', $quiz->id)
                ->where('user_id', $targetUserId)
                ->orderBy('completed_at', 'desc')
                ->firstOrFail();
        }

        $attempt = QuizAttempt::findOrFail($result->attempt_id);
        $questions = $quiz->questions()->get();
        $responses = QuizResponse::where('attempt_id', $attempt->id)->get();

        return Inertia::render('Quizzes/Results', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
            ],
            'quiz' => $quiz,
            'result' => $result,
            'attempt' => $attempt,
            'questions' => $questions,
            'responses' => $responses,
            'candidate' => [
                'id' => $result->user_id,
                'name' => $result->user->name ?? 'Utilisateur',
            ],
            'canGrade' => $isManager,
        ]);
    }

    public function ranking(Project $project, Quiz $quiz)
    {
        $this->authorize('view', [$quiz, $project]);

        $rankings = QuizResult::where('quiz_id', $quiz->id)
            ->with('user:id,name,profile_photo_path')
            ->orderBy('score', 'desc')
            ->orderBy('completed_at', 'asc')
            ->orderBy('created_at', 'asc')
            ->get();

        $userRole = $project->users()->where('user_id', Auth::id())->first()?->pivot->role;

        return Inertia::render('Quizzes/Ranking', [
            'project' => [
                'id' => $project->id,
                'name' => $project->name,
            ],
            'quiz' => $quiz,
            'rankings' => $rankings,
            'canManage' => Auth::user()->hasRole('admin') || $userRole === 'manager',
        ]);
    }

    public function gradeResponse(Request $request, Project $project, Quiz $quiz, QuizResponse $response)
    {
        $this->authorize('grade', [Quiz::class, $project]);

        $validated = $request->validate([
            'score' => 'required|integer|min:0|max:10',
            'admin_comments' => 'nullable|string',
        ]);

        $response->update([
            'score' => $validated['score'],
            'admin_comments' => $validated['admin_comments'] ?? null,
            'grading_status' => 'graded',
            'graded_by' => Auth::id(),
        ]);

        // Recalculate QuizResult final score
        $attempt = QuizAttempt::findOrFail($response->attempt_id);
        $questions = $quiz->questions()->get();

        $qcmTotal = $questions->where('question_type', 'qcm')->count();
        $writtenTotal = $questions->where('question_type', 'written')->count();

        $result = QuizResult::where('attempt_id', $attempt->id)->first();
        if ($result) {
            $qcmScore = $qcmTotal > 0 ? ($result->correct_answers / $qcmTotal) * 100 : 0;
            
            $allResponses = QuizResponse::where('attempt_id', $attempt->id)->get();
            $writtenEarnedSum = $allResponses->sum('score');
            $writtenMaxSum = $writtenTotal * 10;
            $writtenScore = $writtenMaxSum > 0 ? ($writtenEarnedSum / $writtenMaxSum) * 100 : 0;

            if ($qcmTotal > 0 && $writtenTotal > 0) {
                $finalScore = ($qcmScore + $writtenScore) / 2;
            } elseif ($writtenTotal > 0) {
                $finalScore = $writtenScore;
            } else {
                $finalScore = $qcmScore;
            }

            $result->update([
                'score' => (int) round($finalScore),
            ]);
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
}

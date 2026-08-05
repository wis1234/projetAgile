<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\QuizResponse;
use App\Models\QuizResult;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class PublicQuizController extends Controller
{
    public function show(string $token)
    {
        $quiz = Quiz::where('public_token', $token)
            ->where('allow_public_access', true)
            ->where('is_active', true)
            ->withCount('questions')
            ->firstOrFail();

        $user = Auth::user();
        $activeAttempt = null;
        $latestResult = null;

        if ($user) {
            $activeAttempt = QuizAttempt::where('quiz_id', $quiz->id)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                        ->orWhere(function ($query) use ($user) {
                            $query->whereNull('user_id')
                                ->where('guest_email', $user->email);
                        });
                })
                ->where('status', 'in_progress')
                ->first();

            $latestResult = QuizResult::where('quiz_id', $quiz->id)
                ->where(function ($query) use ($user) {
                    $query->where('user_id', $user->id)
                        ->orWhere(function ($query) use ($user) {
                            $query->whereNull('user_id')
                                ->where('guest_email', $user->email);
                        });
                })
                ->orderBy('completed_at', 'desc')
                ->first();
        }

        return Inertia::render('Quizzes/PublicShow', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'duration_minutes' => $quiz->duration_minutes,
                'questions_count' => $quiz->questions_count,
                'public_token' => $quiz->public_token,
            ],
            'currentUser' => $user ? [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ] : null,
            'requiresAuth' => !Auth::check(),
            'activeAttemptId' => $activeAttempt?->id,
            'latestResultId' => $latestResult?->attempt_id,
        ]);
    }

    public function start(Request $request, string $token)
    {
        if (!Auth::check()) {
            return redirect()->route('login', [
                'redirect' => route('quizzes.public.show', $token),
                'candidate' => 1,
            ]);
        }

        $quiz = Quiz::where('public_token', $token)
            ->where('allow_public_access', true)
            ->where('is_active', true)
            ->firstOrFail();

        $user = Auth::user();

        $existingAttempt = QuizAttempt::where('quiz_id', $quiz->id)
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere(function ($query) use ($user) {
                        $query->whereNull('user_id')
                            ->where('guest_email', $user->email);
                    });
            })
            ->where('status', 'in_progress')
            ->first();

        if ($existingAttempt) {
            if ($existingAttempt->user_id === null) {
                $existingAttempt->update([
                    'user_id' => $user->id,
                    'guest_name' => $user->name,
                    'guest_email' => $user->email,
                ]);
            }

            return redirect()->route('quizzes.public.take', [$token, $existingAttempt->id]);
        }

        $completedAttempts = QuizAttempt::where('quiz_id', $quiz->id)
            ->where(function ($query) use ($user) {
                $query->where('user_id', $user->id)
                    ->orWhere(function ($query) use ($user) {
                        $query->whereNull('user_id')
                            ->where('guest_email', $user->email);
                    });
            })
            ->where('status', 'completed')
            ->count();

        if ($quiz->max_attempts > 0 && $completedAttempts >= $quiz->max_attempts) {
            return redirect()->route('quizzes.public.show', $token)
                ->with('error', 'Vous avez atteint le nombre maximum de tentatives pour ce quiz.');
        }

        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'guest_name' => $user->name,
            'guest_email' => $user->email,
            'answers' => [],
            'status' => 'in_progress',
            'started_at' => now(),
        ]);

        return redirect()->route('quizzes.public.take', [$token, $attempt->id]);
    }

    public function take(string $token, QuizAttempt $attempt)
    {
        $quiz = Quiz::where('public_token', $token)
            ->where('allow_public_access', true)
            ->firstOrFail();

        if ($attempt->quiz_id !== $quiz->id) {
            return redirect()->route('quizzes.public.show', $token);
        }

        if (!Auth::check() || ($attempt->user_id && $attempt->user_id !== Auth::id()) || (!$attempt->user_id && $attempt->guest_email !== Auth::user()->email)) {
            abort(403);
        }

        if ($attempt->status === 'completed') {
            return redirect()->route('quizzes.public.results', [$token, $attempt->id]);
        }

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

        return Inertia::render('Quizzes/PublicTake', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'duration_minutes' => $quiz->duration_minutes,
                'public_token' => $quiz->public_token,
            ],
            'questions' => $questions,
            'attempt' => [
                'id' => $attempt->id,
                'user_name' => Auth::user()->name,
                'guest_name' => $attempt->guest_name,
                'guest_email' => $attempt->guest_email,
                'started_at' => $attempt->started_at->toIso8601String(),
                'answers' => $attempt->answers ?? (object)[],
            ],
        ]);
    }

    public function saveProgress(Request $request, string $token, QuizAttempt $attempt)
    {
        $quiz = Quiz::where('public_token', $token)->firstOrFail();

        if ($attempt->quiz_id !== $quiz->id || $attempt->status === 'completed') {
            return response()->json(['error' => 'Invalide'], 400);
        }

        if (!Auth::check() || ($attempt->user_id && $attempt->user_id !== Auth::id()) || (!$attempt->user_id && $attempt->guest_email !== Auth::user()->email)) {
            return response()->json(['error' => 'Non autorisé'], 403);
        }

        $validated = $request->validate([
            'answers' => 'required|array',
        ]);

        $attempt->update([
            'answers' => $validated['answers'],
        ]);

        return response()->json(['success' => true]);
    }

    public function submit(Request $request, string $token, QuizAttempt $attempt)
    {
        $quiz = Quiz::where('public_token', $token)->firstOrFail();

        if ($attempt->quiz_id !== $quiz->id) {
            return redirect()->route('quizzes.public.show', $token);
        }

        if (!Auth::check() || ($attempt->user_id && $attempt->user_id !== Auth::id()) || (!$attempt->user_id && $attempt->guest_email !== Auth::user()->email)) {
            abort(403);
        }

        if ($attempt->status === 'completed') {
            return redirect()->route('quizzes.public.results', [$token, $attempt->id]);
        }

        $validated = $request->validate([
            'answers' => 'nullable|array',
        ]);

        $answers = $validated['answers'] ?? [];
        $questions = $quiz->questions()->get();

        $qcmTotal = $questions->where('question_type', 'qcm')->count();
        $writtenTotal = $questions->where('question_type', 'written')->count();
        $qcmEarned = 0;

        foreach ($questions as $q) {
            $val = $answers[$q->id] ?? null;

            if ($q->question_type === 'written') {
                QuizResponse::create([
                    'quiz_id' => $quiz->id,
                    'question_id' => $q->id,
                    'attempt_id' => $attempt->id,
                    'user_id' => $attempt->user_id,
                    'guest_name' => $attempt->guest_name,
                    'guest_email' => $attempt->guest_email,
                    'answer_text' => is_string($val) ? $val : '',
                    'grading_status' => 'pending',
                    'score' => 0,
                ]);
            } else if ($q->question_type === 'qcm') {
                if ($val !== null && (int)$val === (int)$q->correct_answer) {
                    $qcmEarned++;
                }
            }
        }

        $qcmScore = $qcmTotal > 0 ? ($qcmEarned / $qcmTotal) * 100 : 0;
        $finalScore = $qcmScore;

        if ($qcmTotal > 0 && $writtenTotal > 0) {
            $finalScore = $qcmScore / 2;
        }

        $attempt->update([
            'answers' => $answers,
            'status' => 'completed',
            'completed_at' => now(),
        ]);

        $result = QuizResult::create([
            'quiz_id' => $quiz->id,
            'user_id' => $attempt->user_id,
            'guest_name' => $attempt->guest_name,
            'guest_email' => $attempt->guest_email,
            'attempt_id' => $attempt->id,
            'score' => (int) round($finalScore),
            'correct_answers' => $qcmEarned,
            'total_questions' => $questions->count(),
        ]);

        if ($quiz->show_results) {
            return redirect()->route('quizzes.public.results', [$token, $attempt->id]);
        }

        return Inertia::render('Quizzes/PublicCompleted', [
            'quiz' => [
                'title' => $quiz->title,
            ],
            'guest_name' => $attempt->guest_name,
        ]);
    }

    public function results(string $token, QuizAttempt $attempt)
    {
        $quiz = Quiz::where('public_token', $token)->firstOrFail();

        if (!$quiz->show_results) {
            return redirect()->route('quizzes.public.show', $token);
        }

        if (!Auth::check() || ($attempt->user_id && $attempt->user_id !== Auth::id()) || (!$attempt->user_id && $attempt->guest_email !== Auth::user()->email)) {
            abort(403);
        }

        $result = QuizResult::where('attempt_id', $attempt->id)->firstOrFail();
        $questions = $quiz->questions()->get();
        $responses = QuizResponse::where('attempt_id', $attempt->id)->get();

        return Inertia::render('Quizzes/PublicResults', [
            'quiz' => $quiz,
            'result' => $result,
            'attempt' => $attempt,
            'questions' => $questions,
            'responses' => $responses,
            'candidate' => [
                'name' => $attempt->guest_name,
                'email' => $attempt->guest_email,
            ],
        ]);
    }
}

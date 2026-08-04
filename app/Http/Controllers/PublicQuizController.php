<?php

namespace App\Http\Controllers;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizQuestion;
use App\Models\QuizResponse;
use App\Models\QuizResult;
use Illuminate\Http\Request;
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

        return Inertia::render('Quizzes/PublicShow', [
            'quiz' => [
                'id' => $quiz->id,
                'title' => $quiz->title,
                'description' => $quiz->description,
                'duration_minutes' => $quiz->duration_minutes,
                'questions_count' => $quiz->questions_count,
                'public_token' => $quiz->public_token,
            ],
        ]);
    }

    public function start(Request $request, string $token)
    {
        $quiz = Quiz::where('public_token', $token)
            ->where('allow_public_access', true)
            ->where('is_active', true)
            ->firstOrFail();

        $validated = $request->validate([
            'guest_name' => 'required|string|max:255',
            'guest_email' => 'required|email|max:255',
        ]);

        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => null,
            'guest_name' => $validated['guest_name'],
            'guest_email' => $validated['guest_email'],
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

        if ($attempt->quiz_id !== $quiz->id || $attempt->status === 'completed') {
            return redirect()->route('quizzes.public.show', $token);
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

        if ($attempt->quiz_id !== $quiz->id || $attempt->status === 'completed') {
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
                    'user_id' => null,
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
            'user_id' => null,
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

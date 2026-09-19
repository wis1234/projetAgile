<?php

namespace App\Services\Quiz;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizResponse;
use App\Models\QuizResult;
use Illuminate\Support\Facades\DB;

/**
 * Finalise une tentative (membre connecté OU candidat externe) : une seule implémentation
 * partagée par QuizController et PublicQuizController.
 */
class QuizSubmissionService
{
    public function __construct(private QuizScoringService $scoring)
    {
    }

    public function finalize(Quiz $quiz, QuizAttempt $attempt, array $answers, ?array $cheatingLogs = null): QuizResult
    {
        return DB::transaction(function () use ($quiz, $attempt, $answers, $cheatingLogs) {
            // Verrou : empêche un double envoi (double clic, deux onglets) de créer deux résultats.
            $attempt = QuizAttempt::whereKey($attempt->id)->lockForUpdate()->firstOrFail();

            if ($attempt->status === 'completed') {
                return QuizResult::where('attempt_id', $attempt->id)->firstOrFail();
            }

            $questions = $quiz->questions()->get();

            $attempt->update([
                'answers' => $answers,
                'cheating_logs' => $cheatingLogs ?? $attempt->cheating_logs,
                'status' => 'completed',
                'completed_at' => now(),
            ]);

            foreach ($questions->where('question_type', 'written') as $q) {
                $val = $answers[$q->id] ?? null;
                $text = is_string($val) ? $val : '';
                $blank = trim($text) === '';

                // Une réponse laissée vide est notée 0 automatiquement : inutile de la faire corriger.
                QuizResponse::updateOrCreate(
                    [
                        'quiz_id' => $quiz->id,
                        'question_id' => $q->id,
                        'attempt_id' => $attempt->id,
                    ],
                    [
                        'user_id' => $attempt->user_id,
                        'guest_name' => $attempt->guest_name,
                        'guest_email' => $attempt->guest_email,
                        'answer_text' => $text,
                        'grading_status' => $blank ? 'graded' : 'pending',
                        'score' => $blank ? 0 : null,
                        'admin_comments' => $blank ? 'Aucune réponse rédigée (0 attribué automatiquement).' : null,
                    ]
                );
            }

            $scores = $this->scoring->scoresForAttempt($quiz, $attempt->refresh(), $questions);

            if (!$scores['is_pending'] && $questions->where('question_type', 'written')->isNotEmpty()) {
                $attempt->update(['graded_at' => now()]);
            }

            return QuizResult::create([
                'quiz_id' => $quiz->id,
                'user_id' => $attempt->user_id,
                'guest_name' => $attempt->guest_name,
                'guest_email' => $attempt->guest_email,
                'attempt_id' => $attempt->id,
                'score' => $scores['score'],
                'score_exact' => $scores['score_exact'],
                'correct_answers' => $scores['correct_answers'],
                'total_questions' => $scores['total_questions'],
                'grading_status' => $scores['is_pending'] ? QuizResult::STATUS_PENDING : QuizResult::STATUS_GRADED,
                'completed_at' => now(),
            ]);
        });
    }
}

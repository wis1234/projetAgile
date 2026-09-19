<?php

namespace App\Services\Quiz;

use App\Models\ParticipationPoint;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizResponse;
use App\Models\QuizResult;
use Illuminate\Support\Collection;

/**
 * Source unique de vérité pour le calcul des notes d'un quiz.
 *
 *  - QCM       : % de bonnes réponses
 *  - Écrit     : somme des notes / (nb de questions écrites × barème)
 *  - Mixte     : moyenne (50 / 50) des deux parties
 *
 * Tant qu'au moins une question écrite n'est pas corrigée, le résultat est « en attente ».
 */
class QuizScoringService
{
    public static function writtenMax(): int
    {
        return max(1, (int) config('quiz.written_max_score', 10));
    }

    public static function passMark(): float
    {
        return (float) config('quiz.pass_mark', 50);
    }

    /**
     * Calcul pur (sans base de données) : facile à tester.
     *
     * @return array{score:int, score_exact:float, qcm_percent:?float, written_percent:?float, is_pending:bool}
     */
    public static function computeScores(
        int $qcmTotal,
        int $qcmEarned,
        int $writtenTotal,
        float $writtenEarned,
        int $writtenGraded
    ): array {
        $qcmPercent = $qcmTotal > 0 ? ($qcmEarned / $qcmTotal) * 100 : null;
        $writtenPercent = $writtenTotal > 0
            ? ($writtenEarned / ($writtenTotal * self::writtenMax())) * 100
            : null;

        $parts = array_values(array_filter([$qcmPercent, $writtenPercent], fn ($v) => $v !== null));
        $final = count($parts) > 0 ? array_sum($parts) / count($parts) : 0.0;
        $final = max(0.0, min(100.0, $final));

        return [
            'score' => (int) round($final),
            'score_exact' => round($final, 2),
            'qcm_percent' => $qcmPercent !== null ? round($qcmPercent, 2) : null,
            'written_percent' => $writtenPercent !== null ? round($writtenPercent, 2) : null,
            'is_pending' => $writtenTotal > 0 && $writtenGraded < $writtenTotal,
        ];
    }

    /**
     * Moyenne pondérée d'un candidat sur plusieurs quiz (calcul pur).
     *
     * @param array<int,?float> $notes  quizId => note (null = quiz non passé)
     * @param array<int,float>  $coefs  quizId => coefficient
     */
    public static function weightedAverage(array $notes, array $coefs, string $missingPolicy = 'zero'): ?float
    {
        $sum = 0.0;
        $weight = 0.0;

        foreach ($coefs as $quizId => $coef) {
            $note = $notes[$quizId] ?? null;

            if ($note === null) {
                if ($missingPolicy === 'ignore') {
                    continue;
                }
                $note = 0.0;
            }

            $sum += $note * $coef;
            $weight += $coef;
        }

        return $weight > 0 ? round($sum / $weight, 2) : null;
    }

    /**
     * Attribue les rangs (ex æquo = même rang). Les lignes sans note (« en attente ») n'ont pas de rang.
     *
     * @param array<int,array> $rows
     */
    public static function assignRanks(array $rows, string $field = 'final'): array
    {
        $rank = 0;
        $position = 0;
        $previous = null;

        foreach ($rows as $i => $row) {
            if (!empty($row['is_pending']) || $row[$field] === null) {
                $rows[$i]['rank'] = null;
                continue;
            }

            $position++;
            if ($previous === null || abs($row[$field] - $previous) > 0.004) {
                $rank = $position;
            }
            $previous = $row[$field];
            $rows[$i]['rank'] = $rank;
        }

        return $rows;
    }

    /**
     * Recalcule les notes d'une tentative à partir des réponses enregistrées.
     */
    public function scoresForAttempt(
        Quiz $quiz,
        QuizAttempt $attempt,
        ?Collection $questions = null,
        ?Collection $responses = null
    ): array {
        $questions ??= $quiz->questions()->get();
        $responses ??= QuizResponse::where('attempt_id', $attempt->id)->get();
        $answers = $attempt->answers ?? [];

        $qcmTotal = 0;
        $qcmEarned = 0;
        $writtenTotal = 0;

        foreach ($questions as $q) {
            if ($q->question_type === 'qcm') {
                $qcmTotal++;
                $val = $answers[$q->id] ?? null;
                if ($val !== null && $val !== '' && (int) $val === (int) $q->correct_answer) {
                    $qcmEarned++;
                }
            } else {
                $writtenTotal++;
            }
        }

        $graded = $responses->where('grading_status', 'graded');
        $result = self::computeScores(
            $qcmTotal,
            $qcmEarned,
            $writtenTotal,
            (float) $graded->sum('score'),
            min($graded->count(), $writtenTotal)
        );

        $result['correct_answers'] = $qcmEarned;
        $result['total_questions'] = $questions->count();

        return $result;
    }

    /**
     * Met à jour le QuizResult d'une tentative (appelé après chaque correction).
     */
    public function refreshResult(QuizResult $result): QuizResult
    {
        $attempt = QuizAttempt::findOrFail($result->attempt_id);
        $scores = $this->scoresForAttempt($result->quiz, $attempt);

        $result->update([
            'score' => $scores['score'],
            'score_exact' => $scores['score_exact'],
            'correct_answers' => $scores['correct_answers'],
            'total_questions' => $scores['total_questions'],
            'grading_status' => $scores['is_pending'] ? QuizResult::STATUS_PENDING : QuizResult::STATUS_GRADED,
        ]);

        return $result->fresh();
    }

    /**
     * Un résultat par candidat : la meilleure tentative corrigée (à défaut, la plus récente en attente).
     *
     * @return Collection<string,QuizResult> clé = clé candidat
     */
    public function bestResults(Quiz $quiz): Collection
    {
        return QuizResult::where('quiz_id', $quiz->id)
            ->with('user:id,name,email,profile_photo_path')
            ->get()
            ->groupBy(fn (QuizResult $r) => $r->candidateKey())
            ->map(function (Collection $group) {
                $graded = $group->where('grading_status', QuizResult::STATUS_GRADED);
                $best = $graded->isNotEmpty()
                    ? $graded->sortByDesc(fn ($r) => $r->exactScore())->first()
                    : $group->sortByDesc('id')->first();
                $best->setAttribute('attempts_count', $group->count());

                return $best;
            });
    }

    /**
     * Résultats finaux d'un quiz, classés, avec détail QCM / écrit et bonus de participation.
     *
     * @return array{rows:array<int,array>, stats:array}
     */
    public function finalResults(Quiz $quiz, bool $withBonus = true): array
    {
        $best = $this->bestResults($quiz);
        $questions = $quiz->questions()->get();
        $attempts = QuizAttempt::whereIn('id', $best->pluck('attempt_id'))->get()->keyBy('id');
        $responses = QuizResponse::whereIn('attempt_id', $best->pluck('attempt_id'))->get()->groupBy('attempt_id');

        $bonusTotals = $withBonus ? ParticipationPoint::totalsForProject($quiz->project_id) : collect();

        $rows = $best->map(function (QuizResult $r) use ($quiz, $questions, $attempts, $responses, $bonusTotals, $withBonus) {
            $attempt = $attempts->get($r->attempt_id);
            $detail = $attempt
                ? $this->scoresForAttempt($quiz, $attempt, $questions, $responses->get($r->attempt_id, collect()))
                : ['qcm_percent' => null, 'written_percent' => null];

            $score = $r->exactScore();
            $bonus = ($withBonus && $r->user_id) ? ParticipationPoint::capped((float) ($bonusTotals[$r->user_id] ?? 0)) : 0.0;
            $final = $r->is_pending ? null : round(min(100.0, $score + $bonus), 2);

            return [
                'rank' => null,
                'key' => $r->candidateKey(),
                'user_id' => $r->user_id,
                'attempt_id' => $r->attempt_id,
                'name' => $r->user?->name ?? $r->guest_name ?? 'Candidat externe',
                'email' => $r->user?->email ?? $r->guest_email,
                'photo' => $r->user?->profile_photo_url,
                'attempts_count' => (int) $r->attempts_count,
                'qcm_percent' => $detail['qcm_percent'],
                'written_percent' => $detail['written_percent'],
                'score' => $score,
                'is_pending' => (bool) $r->is_pending,
                'bonus' => $bonus,
                'final' => $final,
                'passed' => $final !== null && $final >= self::passMark(),
                'completed_at' => optional($r->completed_at)->toIso8601String(),
            ];
        })->values()->all();

        // En attente en dernier, puis note décroissante, puis nom.
        usort($rows, function ($a, $b) {
            if ($a['is_pending'] !== $b['is_pending']) {
                return $a['is_pending'] <=> $b['is_pending'];
            }

            return [$b['final'] ?? 0, $a['name']] <=> [$a['final'] ?? 0, $b['name']];
        });

        $rows = self::assignRanks($rows);

        return ['rows' => $rows, 'stats' => self::stats($rows)];
    }

    /**
     * @param array<int,array> $rows
     */
    public static function stats(array $rows): array
    {
        $scored = array_values(array_filter($rows, fn ($r) => !$r['is_pending'] && $r['final'] !== null));
        $finals = array_column($scored, 'final');

        return [
            'total' => count($rows),
            'graded' => count($scored),
            'pending' => count($rows) - count($scored),
            'average' => count($finals) ? round(array_sum($finals) / count($finals), 2) : null,
            'highest' => count($finals) ? max($finals) : null,
            'lowest' => count($finals) ? min($finals) : null,
            'pass_rate' => count($scored)
                ? round(count(array_filter($scored, fn ($r) => $r['passed'])) / count($scored) * 100, 1)
                : null,
        ];
    }

    /**
     * Formatage français d'un nombre (virgule décimale, sans zéros inutiles).
     */
    public static function fmt(?float $n): string
    {
        if ($n === null) {
            return '—';
        }

        return rtrim(rtrim(number_format($n, 2, ',', ' '), '0'), ',');
    }
}

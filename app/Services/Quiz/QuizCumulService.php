<?php

namespace App\Services\Quiz;

use App\Models\ParticipationPoint;
use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizCumul;
use App\Models\QuizResult;

/**
 * Cumul de plusieurs quiz : moyenne (pondérée) de chaque candidat sur les quiz choisis,
 * plus bonus de participation éventuel, puis classement.
 */
class QuizCumulService
{
    public function __construct(private QuizScoringService $scoring)
    {
    }

    /**
     * Quiz du projet pouvant entrer dans un cumul (hors brouillons), avec leur état de correction.
     */
    public function selectableQuizzes(Project $project): array
    {
        return Quiz::where('project_id', $project->id)
            ->where('is_draft', false)
            ->withCount([
                'questions',
                'results',
                'results as pending_results_count' => fn ($q) => $q->where('grading_status', QuizResult::STATUS_PENDING),
            ])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Quiz $q) => [
                'id' => $q->id,
                'title' => $q->title,
                'quiz_type' => $q->quiz_type,
                'questions_count' => $q->questions_count,
                'participants_count' => $q->results_count,
                'pending_count' => $q->pending_results_count,
                'validated' => $q->isValidated(),
                'created_at' => optional($q->created_at)->toIso8601String(),
                // On ne peut cumuler que des quiz sans copie en attente et avec au moins un résultat.
                'selectable' => $q->results_count > 0 && $q->pending_results_count === 0,
            ])
            ->all();
    }

    /**
     * @param array<int,array{quiz_id:int,coefficient:float|int|string}> $items
     * @return array{quizzes:array, rows:array, stats:array, blocking:array, method:array}
     */
    public function compute(Project $project, array $items, string $missingPolicy, bool $includeBonus): array
    {
        $coefs = [];
        foreach ($items as $item) {
            $coefs[(int) $item['quiz_id']] = max(0.01, (float) ($item['coefficient'] ?? 1));
        }

        $quizzes = Quiz::where('project_id', $project->id)
            ->whereIn('id', array_keys($coefs))
            ->get()
            ->keyBy('id');

        $blocking = [];
        $notes = [];       // clé candidat => quizId => note
        $pending = [];     // clé candidat => [quizId]
        $identity = [];    // clé candidat => infos

        foreach ($quizzes as $quiz) {
            foreach ($this->scoring->bestResults($quiz) as $key => $result) {
                $identity[$key] ??= [
                    'user_id' => $result->user_id,
                    'name' => $result->user?->name ?? $result->guest_name ?? 'Candidat externe',
                    'email' => $result->user?->email ?? $result->guest_email,
                    'photo' => $result->user?->profile_photo_url,
                ];

                if ($result->is_pending) {
                    $pending[$key][] = $quiz->id;
                    $blocking[$quiz->id] = $quiz->title;
                    continue;
                }

                $notes[$key][$quiz->id] = $result->exactScore();
            }
        }

        $bonusTotals = $includeBonus ? ParticipationPoint::totalsForQuizzes($project->id, array_keys($coefs)) : collect();
        $passMark = QuizScoringService::passMark();

        $rows = [];
        foreach ($identity as $key => $who) {
            $candidateNotes = $notes[$key] ?? [];
            $isPending = !empty($pending[$key]);
            $average = QuizScoringService::weightedAverage($candidateNotes, $coefs, $missingPolicy);
            $bonus = ($includeBonus && $who['user_id'])
                ? ParticipationPoint::capped((float) ($bonusTotals[$who['user_id']] ?? 0))
                : 0.0;
            $final = ($average !== null && !$isPending) ? round(min(100.0, $average + $bonus), 2) : null;

            $rows[] = $who + [
                'key' => $key,
                'rank' => null,
                'notes' => (object) $candidateNotes, // objet : garde les clés numériques en JSON
                'quizzes_taken' => count($candidateNotes),
                'is_pending' => $isPending,
                'average' => $average,
                'bonus' => $bonus,
                'final' => $final,
                'passed' => $final !== null && $final >= $passMark,
                'calculation' => $this->explain($candidateNotes, $coefs, $missingPolicy, $average, $bonus, $final),
            ];
        }

        usort($rows, function ($a, $b) {
            if ($a['is_pending'] !== $b['is_pending']) {
                return $a['is_pending'] <=> $b['is_pending'];
            }

            return [$b['final'] ?? -1, $a['name']] <=> [$a['final'] ?? -1, $b['name']];
        });

        $rows = QuizScoringService::assignRanks($rows);

        return [
            'quizzes' => $quizzes->map(fn (Quiz $q) => [
                'id' => $q->id,
                'title' => $q->title,
                'coefficient' => $coefs[$q->id],
                'validated' => $q->isValidated(),
            ])->values()->all(),
            'rows' => $rows,
            'stats' => QuizScoringService::stats($rows),
            'blocking' => $blocking,
            'method' => [
                'missing_policy' => $missingPolicy,
                'include_bonus' => $includeBonus,
                'bonus_cap' => (float) config('quiz.participation_cap', 10),
                'pass_mark' => $passMark,
            ],
        ];
    }

    public function computeForCumul(QuizCumul $cumul): array
    {
        $items = $cumul->items()->get()->map(fn ($i) => [
            'quiz_id' => $i->quiz_id,
            'coefficient' => $i->coefficient,
        ])->all();

        return $this->compute($cumul->project, $items, $cumul->missing_policy, (bool) $cumul->include_bonus);
    }

    /**
     * Phrase de calcul lisible : « (72,5 × 1 + 80 × 2) ÷ 3 = 77,5 — bonus +2 → 79,5 ».
     */
    private function explain(array $notes, array $coefs, string $policy, ?float $average, float $bonus, ?float $final): string
    {
        $fmt = fn (?float $n) => QuizScoringService::fmt($n);
        $terms = [];
        $weight = 0.0;

        foreach ($coefs as $quizId => $coef) {
            $note = $notes[$quizId] ?? null;
            if ($note === null && $policy === 'ignore') {
                continue;
            }
            $terms[] = $fmt($note ?? 0.0) . ' × ' . $fmt($coef);
            $weight += $coef;
        }

        if (empty($terms) || $average === null) {
            return 'Aucune note disponible';
        }

        $text = '(' . implode(' + ', $terms) . ') ÷ ' . $fmt($weight) . ' = ' . $fmt($average);

        if ($bonus > 0) {
            $text .= ' ; bonus participation +' . $fmt($bonus) . ' = ' . $fmt($final);
        }

        return $text;
    }
}

<?php

namespace Tests\Unit;

use App\Services\Quiz\QuizScoringService;
use Tests\TestCase;

class QuizScoringServiceTest extends TestCase
{
    public function test_qcm_only_score(): void
    {
        $r = QuizScoringService::computeScores(10, 7, 0, 0, 0);

        $this->assertSame(70, $r['score']);
        $this->assertFalse($r['is_pending']);
    }

    public function test_written_quiz_is_pending_until_every_copy_is_graded(): void
    {
        $pending = QuizScoringService::computeScores(0, 0, 2, 0, 0);
        $this->assertTrue($pending['is_pending']);

        $graded = QuizScoringService::computeScores(0, 0, 2, 14, 2); // 14 / 20
        $this->assertFalse($graded['is_pending']);
        $this->assertSame(70, $graded['score']);
    }

    public function test_mixed_quiz_averages_both_parts(): void
    {
        $r = QuizScoringService::computeScores(4, 4, 1, 5, 1); // QCM 100 %, écrit 50 %

        $this->assertSame(75, $r['score']);
        $this->assertSame(100.0, $r['qcm_percent']);
        $this->assertSame(50.0, $r['written_percent']);
    }

    public function test_weighted_average_and_missing_policy(): void
    {
        $this->assertSame(73.33, QuizScoringService::weightedAverage([1 => 80.0, 2 => 60.0], [1 => 2.0, 2 => 1.0]));
        $this->assertSame(40.0, QuizScoringService::weightedAverage([1 => 80.0], [1 => 1.0, 2 => 1.0], 'zero'));
        $this->assertSame(80.0, QuizScoringService::weightedAverage([1 => 80.0], [1 => 1.0, 2 => 1.0], 'ignore'));
        $this->assertNull(QuizScoringService::weightedAverage([], [1 => 1.0], 'ignore'));
    }

    public function test_ranks_handle_ties_and_pending(): void
    {
        $rows = [
            ['final' => 90.0, 'is_pending' => false],
            ['final' => 80.0, 'is_pending' => false],
            ['final' => 80.0, 'is_pending' => false],
            ['final' => 70.0, 'is_pending' => false],
            ['final' => null, 'is_pending' => true],
        ];

        $this->assertSame([1, 2, 2, 4, null], array_column(QuizScoringService::assignRanks($rows), 'rank'));
    }
}

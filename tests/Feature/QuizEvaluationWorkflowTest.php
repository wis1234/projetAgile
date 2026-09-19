<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizResult;
use App\Models\User;
use App\Services\Quiz\QuizGradingService;
use App\Services\Quiz\QuizSubmissionService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QuizEvaluationWorkflowTest extends TestCase
{
    use RefreshDatabase;

    private Project $project;
    private User $manager1;
    private User $manager2;
    private User $candidate;

    protected function setUp(): void
    {
        parent::setUp();

        $this->project = Project::factory()->create();
        $this->manager1 = User::factory()->create();
        $this->manager2 = User::factory()->create();
        $this->candidate = User::factory()->create();

        foreach ([$this->manager1, $this->manager2] as $m) {
            $this->project->users()->attach($m->id, ['role' => 'manager', 'is_muted' => false]);
        }
        $this->project->users()->attach($this->candidate->id, ['role' => 'collaborator', 'is_muted' => false]);
    }

    private function makeQuiz(array $questions, string $title = 'Quiz test'): Quiz
    {
        $quiz = Quiz::create([
            'project_id' => $this->project->id,
            'created_by' => $this->manager1->id,
            'title' => $title,
            'quiz_type' => 'mixed',
            'duration_minutes' => 10,
            'max_attempts' => 1,
            'is_active' => true,
            'show_results' => true,
        ]);

        foreach ($questions as $i => $q) {
            $quiz->questions()->create($q + ['order' => $i + 1]);
        }

        return $quiz;
    }

    private function submit(Quiz $quiz, User $user, array $answers): QuizResult
    {
        $attempt = QuizAttempt::create([
            'quiz_id' => $quiz->id,
            'user_id' => $user->id,
            'answers' => [],
            'status' => 'in_progress',
            'started_at' => now()->subMinutes(5),
        ]);

        return app(QuizSubmissionService::class)->finalize($quiz, $attempt, $answers);
    }

    public function test_a_question_can_be_saved_individually_on_a_draft_quiz(): void
    {
        $this->actingAs($this->manager1);

        $draft = $this->postJson(route('projects.quizzes.draft', $this->project->id), [
            'title' => 'Brouillon',
            'duration_minutes' => 10,
            'max_attempts' => 1,
        ])->assertCreated();

        $quizId = $draft->json('quiz.id');
        $this->assertTrue(Quiz::find($quizId)->is_draft);

        $this->postJson(route('projects.quizzes.questions.store', [$this->project->id, $quizId]), [
            'question_text' => 'Q1 ?', 'question_type' => 'qcm',
            'option_a' => 'A', 'option_b' => 'B', 'correct_answer' => 1,
        ])->assertCreated()->assertJsonPath('question.order', 1);

        $this->postJson(route('projects.quizzes.questions.store', [$this->project->id, $quizId]), [
            'question_text' => 'Q2 ?', 'question_type' => 'written',
        ])->assertCreated()->assertJsonPath('question.order', 2)->assertJsonPath('quiz_type', 'mixed');
    }

    public function test_written_answer_is_pending_then_graded_and_score_is_computed(): void
    {
        $quiz = $this->makeQuiz([['question_text' => 'Expliquez', 'question_type' => 'written']]);

        $result = $this->submit($quiz, $this->candidate, [$quiz->questions()->first()->id => 'Ma réponse']);

        $this->assertTrue($result->is_pending);

        $attempt = QuizAttempt::find($result->attempt_id);
        $response = $attempt->responses()->first();

        $graded = app(QuizGradingService::class)->saveCopy($quiz, $attempt, $this->manager1, [
            ['response_id' => $response->id, 'score' => 8, 'comment' => 'Bien'],
        ]);

        $this->assertFalse($graded->is_pending);
        $this->assertSame(80, $graded->score);
    }

    public function test_blank_written_answer_is_graded_zero_automatically(): void
    {
        $quiz = $this->makeQuiz([['question_text' => 'Expliquez', 'question_type' => 'written']]);

        $result = $this->submit($quiz, $this->candidate, [$quiz->questions()->first()->id => '   ']);

        $this->assertFalse($result->is_pending);
        $this->assertSame(0, $result->score);
    }

    public function test_deliberation_needs_every_manager_password_then_locks_grading(): void
    {
        $quiz = $this->makeQuiz([['question_text' => 'Expliquez', 'question_type' => 'written']]);
        $result = $this->submit($quiz, $this->candidate, [$quiz->questions()->first()->id => 'Réponse']);

        // Impossible de délibérer tant qu'une copie est en attente
        $this->actingAs($this->manager1)
            ->post(route('projects.quizzes.deliberation.open', [$this->project->id, $quiz->id]))
            ->assertSessionHasErrors('deliberation');

        $attempt = QuizAttempt::find($result->attempt_id);
        app(QuizGradingService::class)->saveCopy($quiz, $attempt, $this->manager1, [
            ['response_id' => $attempt->responses()->first()->id, 'score' => 7, 'comment' => null],
        ]);

        $this->post(route('projects.quizzes.deliberation.open', [$this->project->id, $quiz->id]))->assertRedirect();
        $this->assertSame('open', $quiz->fresh()->deliberation_status);

        // Mauvais mot de passe
        $this->post(route('projects.quizzes.deliberation.approve', [$this->project->id, $quiz->id]), ['password' => 'nope'])
            ->assertSessionHasErrors('password');

        // Aval du premier manager : pas encore validé
        $this->post(route('projects.quizzes.deliberation.approve', [$this->project->id, $quiz->id]), ['password' => 'password'])
            ->assertSessionHasNoErrors();
        $this->assertSame('open', $quiz->fresh()->deliberation_status);

        // Aval du second manager : validé
        $this->actingAs($this->manager2)
            ->post(route('projects.quizzes.deliberation.approve', [$this->project->id, $quiz->id]), ['password' => 'password']);
        $this->assertSame('validated', $quiz->fresh()->deliberation_status);

        // La correction est verrouillée
        $this->expectException(\Symfony\Component\HttpKernel\Exception\HttpException::class);
        app(QuizGradingService::class)->saveCopy($quiz->fresh(), $attempt, $this->manager1, [
            ['response_id' => $attempt->responses()->first()->id, 'score' => 10, 'comment' => null],
        ]);
    }

    public function test_grading_claim_reserves_a_copy_for_a_single_corrector(): void
    {
        $quiz = $this->makeQuiz([['question_text' => 'Expliquez', 'question_type' => 'written']]);
        $qid = $quiz->questions()->first()->id;
        $this->submit($quiz, $this->candidate, [$qid => 'Réponse']);

        $service = app(QuizGradingService::class);

        $first = $service->claim($quiz, $this->manager1);
        $second = $service->claim($quiz, $this->manager2);

        $this->assertNotNull($first['attempt']);
        $this->assertNull($second['attempt']);
    }

    public function test_cumul_preview_computes_weighted_average(): void
    {
        $qcm = fn () => [[
            'question_text' => 'Q', 'question_type' => 'qcm',
            'option_a' => 'A', 'option_b' => 'B', 'correct_answer' => 0,
        ]];

        $quizA = $this->makeQuiz($qcm(), 'A');
        $quizB = $this->makeQuiz($qcm(), 'B');

        $this->submit($quizA, $this->candidate, [$quizA->questions()->first()->id => 0]); // 100 %
        $this->submit($quizB, $this->candidate, [$quizB->questions()->first()->id => 1]); // 0 %

        $this->actingAs($this->manager1)
            ->postJson(route('projects.quiz-cumuls.preview', $this->project->id), [
                'missing_policy' => 'zero',
                'include_bonus' => false,
                'items' => [
                    ['quiz_id' => $quizA->id, 'coefficient' => 2],
                    ['quiz_id' => $quizB->id, 'coefficient' => 1],
                ],
            ])
            ->assertOk()
            ->assertJsonPath('rows.0.average', 66.67)
            ->assertJsonPath('rows.0.rank', 1);
    }

    public function test_a_member_cannot_access_grading_or_deliberation(): void
    {
        $quiz = $this->makeQuiz([['question_text' => 'Q', 'question_type' => 'written']]);

        $this->actingAs($this->candidate)
            ->get(route('projects.quizzes.grading', [$this->project->id, $quiz->id]))
            ->assertForbidden();

        $this->get(route('projects.quizzes.deliberation', [$this->project->id, $quiz->id]))->assertForbidden();
    }
}

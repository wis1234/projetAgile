<?php

namespace Tests\Feature\Quiz;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizResponse;

/**
 * Régression : chaque action du module doit répondre par une redirection / du JSON valides.
 * Un code 500 renvoyait l'utilisateur vers /login, donc vers le dashboard, via le gestionnaire
 * global « invalid » d'Inertia.
 */
class QuizActionsDoNotErrorTest extends QuizHttpTestCase
{
    public function test_create_update_and_delete_a_quiz(): void
    {
        $base = "/projects/{$this->project->id}/quizzes";
        $questions = [$this->qcm() + ['question_text' => 'Q ?']];

        $this->actingAs($this->manager1)->post($base, [
            'title' => 'Nouveau', 'duration_minutes' => 10, 'max_attempts' => 1, 'questions' => $questions,
        ])->assertRedirect(route('projects.quizzes.index', $this->project->id));

        $quiz = Quiz::where('title', 'Nouveau')->firstOrFail();

        $this->actingAs($this->manager1)->put("$base/{$quiz->id}", [
            'title' => 'Renommé', 'duration_minutes' => 10, 'max_attempts' => 1, 'questions' => $questions,
        ])->assertRedirect();

        $this->actingAs($this->manager1)->delete("$base/{$quiz->id}")->assertRedirect();
        $this->assertNull(Quiz::find($quiz->id));
    }

    public function test_submit_grade_deliberate_and_cumulate(): void
    {
        $quiz = $this->makeQuiz([$this->qcm(), $this->written()]);
        $other = $this->makeQuiz([$this->qcm()], 'Second quiz');
        [$qcm, $written] = $quiz->questions->all();

        // --- Soumission par le candidat --------------------------------
        $this->actingAs($this->candidate)->post($this->quizUrl($quiz, '/launch'))->assertOk();
        $attempt = QuizAttempt::where('quiz_id', $quiz->id)->firstOrFail();

        $this->actingAs($this->candidate)->post($this->quizUrl($quiz, '/submit'), [
            'attempt_id' => $attempt->id,
            'answers' => [$qcm->id => 0, $written->id => 'Une réponse rédigée'],
        ])->assertRedirect();

        $this->actingAs($this->candidate)->post($this->quizUrl($other, '/launch'))->assertOk();
        $otherAttempt = QuizAttempt::where('quiz_id', $other->id)->firstOrFail();
        $this->actingAs($this->candidate)->post($this->quizUrl($other, '/submit'), [
            'attempt_id' => $otherAttempt->id, 'answers' => [$other->questions->first()->id => 0],
        ])->assertRedirect();

        // --- Correction ------------------------------------------------
        $response = QuizResponse::where('attempt_id', $attempt->id)->firstOrFail();
        $this->actingAs($this->manager1)->post($this->quizUrl($quiz, "/grading/{$attempt->id}"), [
            'grades' => [['response_id' => $response->id, 'score' => 8, 'comment' => 'Bien']],
        ])->assertRedirect();

        // --- Délibération ----------------------------------------------
        $this->actingAs($this->manager1)->post($this->quizUrl($quiz, '/deliberation/open'))->assertRedirect();
        $this->actingAs($this->manager1)->post($this->quizUrl($quiz, '/deliberation/approve'), ['password' => 'password'])->assertRedirect();
        $this->actingAs($this->manager2)->post($this->quizUrl($quiz, '/deliberation/approve'), ['password' => 'password'])->assertRedirect();

        // --- Cumul -----------------------------------------------------
        $this->actingAs($this->manager1)->post("/projects/{$this->project->id}/quiz-cumuls", [
            'title' => 'Cumul',
            'items' => [
                ['quiz_id' => $quiz->id, 'coefficient' => 2],
                ['quiz_id' => $other->id, 'coefficient' => 3],
            ],
            'missing_policy' => 'zero',
            'include_bonus' => true,
        ])->assertRedirect();
    }

    public function test_cumul_keeps_the_exact_coefficients_chosen(): void
    {
        $q1 = $this->makeQuiz([$this->qcm()], 'Quiz 1');
        $q2 = $this->makeQuiz([$this->qcm()], 'Quiz 2');

        // Le candidat obtient 100 % au Quiz 1 et 0 % au Quiz 2
        foreach ([[$q1, 0], [$q2, 1]] as [$quiz, $answer]) {
            $this->actingAs($this->candidate)->post($this->quizUrl($quiz, '/launch'))->assertOk();
            $attempt = QuizAttempt::where('quiz_id', $quiz->id)->firstOrFail();
            $this->actingAs($this->candidate)->post($this->quizUrl($quiz, '/submit'), [
                'attempt_id' => $attempt->id, 'answers' => [$quiz->questions->first()->id => $answer],
            ])->assertRedirect();
        }

        $url = "/projects/{$this->project->id}/quiz-cumuls";
        $payload = fn (array $c) => [
            'items' => [['quiz_id' => $q1->id, 'coefficient' => $c[0]], ['quiz_id' => $q2->id, 'coefficient' => $c[1]]],
            'missing_policy' => 'zero', 'include_bonus' => true,
        ];

        // 2 et 3 : exactement ceux choisis (pas 2,01 / 3,01) -> (100×2 + 0×3) / 5 = 40
        $json = $this->actingAs($this->manager1)->postJson("$url/preview", $payload([2, 3]))->assertOk()->json();
        $this->assertEquals([2.0, 3.0], array_column($json['quizzes'], 'coefficient'));
        $this->assertEquals(40, $json['rows'][0]['average']);
        $this->assertStringContainsString('× 2', $json['rows'][0]['calculation']);

        // Décimales libres
        $json = $this->actingAs($this->manager1)->postJson("$url/preview", $payload([2.5, 0.75]))->assertOk()->json();
        $this->assertEquals([2.5, 0.75], array_column($json['quizzes'], 'coefficient'));
        $this->assertEquals(76.92, $json['rows'][0]['average']); // 250 / 3,25

        $this->actingAs($this->manager1)->post($url, $payload([3, 2.5]) + ['title' => 'Pondéré'])->assertSessionHasNoErrors();
        $stored = \App\Models\QuizCumul::firstOrFail()->items()->orderBy('id')->pluck('coefficient')->map(fn ($v) => (float) $v)->all();
        $this->assertSame([3.0, 2.5], $stored);
    }

    public function test_participation_bonus_can_be_awarded_and_removed(): void
    {
        $url = "/projects/{$this->project->id}/participation-points";

        $this->actingAs($this->manager1)->post($url, ['user_id' => $this->candidate->id, 'points' => 2, 'reason' => 'Très actif'])
            ->assertRedirect()->assertSessionHasNoErrors();

        $point = \App\Models\ParticipationPoint::firstOrFail();
        $this->actingAs($this->manager1)->delete("$url/{$point->id}")->assertRedirect();
        $this->assertSame(0, \App\Models\ParticipationPoint::count());
    }
}

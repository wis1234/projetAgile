<?php

namespace Tests\Feature\Quiz;

use App\Models\ParticipationPoint;
use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizCandidate;
use App\Models\User;
use App\Services\Quiz\QuizDeliberationService;

/**
 * Le bonus de participation est attribué dans un quiz, à ses MEMBRES (candidats inscrits),
 * et non aux membres du projet.
 */
class QuizBonusTest extends QuizHttpTestCase
{
    private User $outsider; // utilisateur ProJA hors projet, membre du quiz

    protected function setUp(): void
    {
        parent::setUp();
        $this->outsider = User::factory()->create(['name' => 'Diane Externe']);
    }

    private function enrol(Quiz $quiz, User $user): void
    {
        QuizCandidate::create(['quiz_id' => $quiz->id, 'user_id' => $user->id, 'added_by' => $this->manager1->id]);
    }

    /** Fait passer le quiz en donnant une mauvaise réponse : note du quiz = 0 %, donc le bonus se lit tel quel. */
    private function failQuiz(Quiz $quiz, User $user): void
    {
        $this->actingAs($user)->post($this->quizUrl($quiz, '/launch'))->assertOk();
        $attempt = QuizAttempt::where('quiz_id', $quiz->id)->where('user_id', $user->id)->latest('id')->firstOrFail();
        $this->actingAs($user)->post($this->quizUrl($quiz, '/submit'), [
            'attempt_id' => $attempt->id, 'answers' => [$quiz->questions->first()->id => 1],
        ])->assertRedirect();
    }

    private function award(Quiz $quiz, User $to, float $points)
    {
        return $this->actingAs($this->manager1)->post($this->quizUrl($quiz, '/participation'), [
            'user_id' => $to->id, 'points' => $points, 'reason' => 'Très actif',
        ]);
    }

    private function row(Quiz $quiz, User $user): array
    {
        $rows = $this->inertia($this->manager1, $this->quizUrl($quiz, '/ranking'))->json('props.rankings');

        return collect($rows)->firstWhere('user_id', $user->id);
    }

    public function test_bonus_goes_to_quiz_members_including_candidates_outside_the_project(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        $this->enrol($quiz, $this->outsider);

        // La page liste les membres DU QUIZ : la candidate hors projet y est ; les membres du projet non inscrits n'y sont pas
        $members = $this->inertia($this->manager1, $this->quizUrl($quiz, '/participation'))->json('props.members');
        $this->assertSame([$this->outsider->id], array_column($members, 'id'));
        $this->assertTrue($members[0]['enrolled']);

        $this->award($quiz, $this->outsider, 5)->assertSessionHasNoErrors()->assertSessionHas('success');
        $this->assertSame($quiz->id, ParticipationPoint::firstOrFail()->quiz_id);

        // Elle passe le quiz avec 0 % : sa note finale est le bonus
        $this->failQuiz($quiz, $this->outsider->fresh());
        $row = $this->row($quiz, $this->outsider);
        $this->assertEquals(0, $row['score']);
        $this->assertEquals(5, $row['bonus']);
        $this->assertEquals(5, $row['final']);
    }

    public function test_project_members_who_are_not_quiz_members_cannot_receive_a_bonus(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);

        // $this->candidate est membre du PROJET, pas du quiz
        $this->award($quiz, $this->candidate, 3)->assertSessionHasErrors('user_id');
        $this->assertSame(0, ParticipationPoint::count());

        // Une fois ajouté au quiz, c'est possible
        $this->enrol($quiz, $this->candidate);
        $this->award($quiz, $this->candidate, 3)->assertSessionHasNoErrors();
        $this->assertSame(1, ParticipationPoint::count());
    }

    public function test_users_who_already_took_the_quiz_are_members_too(): void
    {
        // Quiz créé avant les inscriptions : les membres du projet qui l'ont passé restent récompensables
        $quiz = $this->makeQuiz([$this->qcm()]);
        $this->failQuiz($quiz, $this->candidate);

        $members = $this->inertia($this->manager1, $this->quizUrl($quiz, '/participation'))->json('props.members');
        $this->assertSame([$this->candidate->id], array_column($members, 'id'));
        $this->assertFalse($members[0]['enrolled']);

        $this->award($quiz, $this->candidate, 2)->assertSessionHasNoErrors();
    }

    public function test_bonus_belongs_to_one_quiz_and_is_capped(): void
    {
        $quizA = $this->makeQuiz([$this->qcm()], 'Quiz A');
        $quizB = $this->makeQuiz([$this->qcm()], 'Quiz B');
        foreach ([$quizA, $quizB] as $q) {
            $this->enrol($q, $this->outsider);
            $this->failQuiz($q, $this->outsider->fresh());
        }

        $this->award($quizA, $this->outsider, 4);
        $this->assertEquals(4, $this->row($quizA, $this->outsider)['bonus']);
        $this->assertEquals(0, $this->row($quizB, $this->outsider)['bonus'], 'le bonus du quiz A ne compte pas dans le quiz B');

        // Plafond : 8 + 8 = 16 -> 10 (config quiz.participation_cap)
        $this->award($quizA, $this->outsider, 8);
        $this->award($quizA, $this->outsider, 8);
        $this->assertEquals(10, $this->row($quizA, $this->outsider)['bonus']);
    }

    public function test_legacy_project_wide_bonus_still_counts_for_every_quiz(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        $this->enrol($quiz, $this->candidate);
        $this->failQuiz($quiz, $this->candidate);

        // Ancien bonus « général » (sans quiz), comme avant
        $this->actingAs($this->manager1)->post("/projects/{$this->project->id}/participation-points", [
            'user_id' => $this->candidate->id, 'points' => 3,
        ])->assertSessionHasNoErrors();
        $this->assertNull(ParticipationPoint::firstOrFail()->quiz_id);
        $this->assertEquals(3, $this->row($quiz, $this->candidate)['bonus']);

        // Il s'additionne au bonus du quiz
        $this->award($quiz, $this->candidate, 2);
        $this->assertEquals(5, $this->row($quiz, $this->candidate)['bonus']);
        $this->assertSame(1, $this->inertia($this->manager1, $this->quizUrl($quiz, '/participation'))->json('props.legacyCount'));
    }

    public function test_bonuses_of_several_quizzes_add_up_in_a_cumul(): void
    {
        $quizA = $this->makeQuiz([$this->qcm()], 'Quiz A');
        $quizB = $this->makeQuiz([$this->qcm()], 'Quiz B');
        foreach ([$quizA, $quizB] as $q) {
            $this->enrol($q, $this->outsider);
            $this->failQuiz($q, $this->outsider->fresh());
        }
        $this->award($quizA, $this->outsider, 3);
        $this->award($quizB, $this->outsider, 4);

        $json = $this->actingAs($this->manager1)->postJson("/projects/{$this->project->id}/quiz-cumuls/preview", [
            'items' => [['quiz_id' => $quizA->id, 'coefficient' => 1], ['quiz_id' => $quizB->id, 'coefficient' => 1]],
            'missing_policy' => 'zero', 'include_bonus' => true,
        ])->assertOk()->json();

        $row = collect($json['rows'])->firstWhere('user_id', $this->outsider->id);
        $this->assertEquals(7, $row['bonus']);
        $this->assertEquals(7, $row['final']); // moyenne 0 % + bonus 7
    }

    public function test_changing_a_bonus_invalidates_the_results_fingerprint(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        $this->enrol($quiz, $this->outsider);
        $this->failQuiz($quiz, $this->outsider->fresh());

        $service = app(QuizDeliberationService::class);
        $before = $service->fingerprint($quiz);

        $this->award($quiz, $this->outsider, 2);
        $after = $service->fingerprint($quiz);
        $this->assertNotSame($before, $after, 'un aval donné avant le bonus n\'est plus valable');

        $entry = ParticipationPoint::firstOrFail();
        $this->actingAs($this->manager1)->delete($this->quizUrl($quiz, "/participation/{$entry->id}"))->assertSessionHas('success');
        $this->assertSame($before, $service->fingerprint($quiz));
    }

    public function test_bonus_is_locked_once_results_are_validated_and_only_managers_manage_it(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        $this->enrol($quiz, $this->outsider);

        // Un membre ordinaire ne peut ni voir ni attribuer
        $this->actingAs($this->candidate)->get($this->quizUrl($quiz, '/participation'))->assertForbidden();
        $this->actingAs($this->candidate)->post($this->quizUrl($quiz, '/participation'), ['user_id' => $this->outsider->id, 'points' => 1])->assertForbidden();

        $quiz->update(['deliberation_status' => Quiz::DELIBERATION_VALIDATED]);
        $this->award($quiz, $this->outsider, 2)->assertSessionHas('error');
        $this->assertSame(0, ParticipationPoint::count());
    }

    public function test_a_quiz_bonus_cannot_be_deleted_through_another_quiz_or_the_legacy_route(): void
    {
        $quizA = $this->makeQuiz([$this->qcm()], 'Quiz A');
        $quizB = $this->makeQuiz([$this->qcm()], 'Quiz B');
        $this->enrol($quizA, $this->outsider);
        $this->award($quizA, $this->outsider, 2);
        $entry = ParticipationPoint::firstOrFail();

        $this->actingAs($this->manager1)->delete($this->quizUrl($quizB, "/participation/{$entry->id}"))->assertNotFound();
        $this->actingAs($this->manager1)->delete("/projects/{$this->project->id}/participation-points/{$entry->id}")->assertNotFound();
        $this->assertSame(1, ParticipationPoint::count());
    }
}

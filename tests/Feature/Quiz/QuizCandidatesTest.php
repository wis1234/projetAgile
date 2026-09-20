<?php

namespace Tests\Feature\Quiz;

use App\Models\Quiz;
use App\Models\QuizAttempt;
use App\Models\QuizCandidate;
use App\Models\User;

class QuizCandidatesTest extends QuizHttpTestCase
{
    private User $outsider;

    protected function setUp(): void
    {
        parent::setUp();

        // Utilisateur inscrit sur ProJA, sans projet
        $this->outsider = User::factory()->create(['name' => 'Diane Externe']);
    }

    private function enrol(Quiz $quiz, User $user): void
    {
        QuizCandidate::create(['quiz_id' => $quiz->id, 'user_id' => $user->id, 'added_by' => $this->manager1->id]);
    }

    public function test_manager_adds_a_registered_user_who_then_takes_the_quiz_and_sees_results(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        $question = $quiz->questions->first();

        // Recherche : 2 caractères minimum, et on ne propose pas deux fois le même
        $this->actingAs($this->manager1)->getJson($this->quizUrl($quiz, '/candidates/search?q=D'))->assertOk()->assertJsonCount(0, 'users');
        $found = $this->actingAs($this->manager1)->getJson($this->quizUrl($quiz, '/candidates/search?q=Diane'))->assertOk();
        $this->assertSame([$this->outsider->id], array_column($found->json('users'), 'id'));
        $this->assertFalse($found->json('users.0.is_member'));

        // Ajout + notification
        $this->actingAs($this->manager1)->post($this->quizUrl($quiz, '/candidates'), ['user_ids' => [$this->outsider->id]])
            ->assertSessionHas('success');
        $this->assertSame(1, $this->outsider->notifications()->count());
        $this->assertStringContainsString('Nouveau quiz', $this->outsider->notifications()->first()->data['title']);

        // Déjà inscrit : n'apparaît plus dans la recherche, et un second ajout ne duplique pas
        $this->actingAs($this->manager1)->getJson($this->quizUrl($quiz, '/candidates/search?q=Diane'))->assertJsonCount(0, 'users');
        $this->actingAs($this->manager1)->post($this->quizUrl($quiz, '/candidates'), ['user_ids' => [$this->outsider->id]]);
        $this->assertSame(1, $quiz->candidates()->count());

        // Rubrique « Quiz » : il voit son quiz et lui seul
        $outsider = $this->outsider->fresh();
        $this->assertTrue($outsider->isQuizCandidateOnly());
        $props = $this->inertia($outsider, '/quizzes')->json('props');
        $this->assertTrue($props['candidateOnly']);
        $this->assertCount(1, $props['quizzes']);
        $this->assertSame('to_take', $props['quizzes'][0]['status']);

        // Il passe le quiz et voit son résultat
        $this->actingAs($outsider)->post($this->quizUrl($quiz, '/launch'))->assertOk();
        $attempt = QuizAttempt::where('quiz_id', $quiz->id)->where('user_id', $outsider->id)->firstOrFail();
        $this->actingAs($outsider)->post($this->quizUrl($quiz, '/submit'), [
            'attempt_id' => $attempt->id, 'answers' => [$question->id => 0],
        ])->assertRedirect();

        $results = $this->inertia($outsider, $this->quizUrl($quiz, '/results'))->assertOk()->json('props');
        $this->assertEquals(100, $results['result']['score']);
        $r = $this->inertia($outsider, '/quizzes');
        $this->assertSame('retake', $r->json('props.quizzes.0.status')); // 1 tentative sur 2 utilisée
        $this->assertEquals(100, $r->json('props.quizzes.0.score'));

        // Mais ni le classement des autres, ni la gestion
        $this->actingAs($outsider)->get($this->quizUrl($quiz, '/ranking'))->assertForbidden();
        $this->actingAs($outsider)->getJson($this->quizUrl($quiz, '/candidates/search?q=Al'))->assertForbidden();
        $this->actingAs($outsider)->post($this->quizUrl($quiz, '/candidates'), ['user_ids' => [$this->outsider->id]])->assertForbidden();
    }

    public function test_candidate_account_is_confined_to_quiz_pages(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        $this->enrol($quiz, $this->outsider);
        $candidate = $this->outsider->fresh();

        foreach (['/dashboard', '/projects', "/projects/{$this->project->id}", '/users', '/files', '/tasks', '/activities'] as $url) {
            $this->actingAs($candidate)->get($url)->assertRedirect(route('quizzes.index'));
        }

        // Appels XHR : refusés proprement, sans redirection
        $this->actingAs($candidate)->getJson('/api/search?q=abc')->assertForbidden();
        $this->actingAs($candidate)->getJson('/api/users/search?q=abc')->assertForbidden();

        // Ce dont il a besoin reste accessible
        $this->actingAs($candidate)->get('/quizzes')->assertOk();
        $this->actingAs($candidate)->get('/profile')->assertOk();
        $this->actingAs($candidate)->get($this->quizUrl($quiz))->assertOk();
        $this->actingAs($candidate)->post('/logout')->assertRedirect();
    }

    public function test_user_gets_the_full_application_back_when_added_to_a_project(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        $this->enrol($quiz, $this->outsider);
        $this->assertTrue($this->outsider->fresh()->isQuizCandidateOnly());

        $this->project->users()->attach($this->outsider->id, ['role' => 'collaborator', 'is_muted' => false]);

        $this->assertFalse($this->outsider->fresh()->isQuizCandidateOnly());
        $this->actingAs($this->outsider->fresh())->get('/dashboard')->assertOk();
    }

    public function test_user_who_is_not_enrolled_cannot_reach_the_quiz(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);

        $this->actingAs($this->outsider)->get($this->quizUrl($quiz))->assertForbidden();
        $this->actingAs($this->outsider)->post($this->quizUrl($quiz, '/launch'))->assertForbidden();
        $this->assertCount(0, $this->inertia($this->outsider, '/quizzes')->json('props.quizzes'));
    }

    public function test_restricted_quiz_is_hidden_from_members_who_are_not_enrolled(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        $member = $this->candidate; // membre du projet

        $this->assertCount(1, $this->inertia($member, '/quizzes')->json('props.quizzes'));

        $this->actingAs($this->manager1)->put($this->quizUrl($quiz, '/candidates/restriction'), ['restricted' => true])
            ->assertSessionHas('success');
        $this->assertTrue($quiz->refresh()->restricted_to_candidates);

        $this->assertCount(0, $this->inertia($member, '/quizzes')->json('props.quizzes'));
        // ... ni dans la liste des quiz du projet
        $this->assertCount(0, $this->inertia($member, "/projects/{$this->project->id}/quizzes")->json('props.quizzes'));
        $this->actingAs($member)->post($this->quizUrl($quiz, '/launch'))->assertForbidden();

        // Les responsables gardent l'accès ; l'inscription rouvre l'accès au membre
        $this->assertCount(1, $this->inertia($this->manager2, '/quizzes')->json('props.quizzes'));
        $this->enrol($quiz, $member);
        $this->assertCount(1, $this->inertia($member, '/quizzes')->json('props.quizzes'));
        $this->actingAs($member)->post($this->quizUrl($quiz, '/launch'))->assertOk();
    }

    public function test_candidates_can_be_removed_only_before_they_start(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        $this->enrol($quiz, $this->outsider);
        $other = User::factory()->create();
        $this->enrol($quiz, $other);

        $started = $quiz->candidates()->where('user_id', $this->outsider->id)->firstOrFail();
        $this->actingAs($this->outsider->fresh())->post($this->quizUrl($quiz, '/launch'))->assertOk();

        $this->actingAs($this->manager1)->delete($this->quizUrl($quiz, "/candidates/{$started->id}"))->assertSessionHas('error');
        $this->assertSame(2, $quiz->candidates()->count());

        $free = $quiz->candidates()->where('user_id', $other->id)->firstOrFail();
        $this->actingAs($this->manager1)->delete($this->quizUrl($quiz, "/candidates/{$free->id}"))->assertSessionHas('success');
        $this->assertSame(1, $quiz->candidates()->count());
    }

    public function test_only_managers_manage_candidates_and_drafts_are_refused(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        $this->actingAs($this->candidate)->post($this->quizUrl($quiz, '/candidates'), ['user_ids' => [$this->outsider->id]])->assertForbidden();

        $draft = $this->makeQuiz([$this->qcm()], 'Brouillon');
        $draft->update(['is_draft' => true]);
        $this->actingAs($this->manager1)->post($this->quizUrl($draft, '/candidates'), ['user_ids' => [$this->outsider->id]])
            ->assertSessionHas('error');
        $this->assertSame(0, $draft->candidates()->count());
    }

    public function test_add_all_project_members_skips_managers(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);

        $this->actingAs($this->manager1)->post($this->quizUrl($quiz, '/candidates/members'))->assertSessionHas('success');

        $this->assertSame([$this->candidate->id], $quiz->candidates()->pluck('user_id')->all());
    }

    public function test_manager_sees_the_roster_with_progress_and_drafts_stay_hidden_from_members(): void
    {
        $quiz = $this->makeQuiz([$this->qcm()]);
        $this->enrol($quiz, $this->outsider);
        $draft = $this->makeQuiz([$this->qcm()], 'Brouillon');
        $draft->update(['is_draft' => true]);

        $roster = $this->inertia($this->manager1, $this->quizUrl($quiz))->json('props.candidates');
        $this->assertCount(1, $roster);
        $this->assertSame('not_started', $roster[0]['status']);
        $this->assertFalse($roster[0]['locked']);

        $titles = fn ($user) => array_column($this->inertia($user, '/quizzes')->json('props.quizzes'), 'title');
        $this->assertContains('Brouillon', $titles($this->manager1));
        $this->assertNotContains('Brouillon', $titles($this->candidate));
    }
}

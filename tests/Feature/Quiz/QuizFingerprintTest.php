<?php

namespace Tests\Feature\Quiz;

use App\Models\ParticipationPoint;
use App\Models\User;
use App\Services\Quiz\QuizDeliberationService;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Support\Facades\Gate;

/**
 * Régressions : « Call to a member function getKey() on string » (empreinte de délibération)
 * et accès 403 à l'administration pour les variantes de rôle administrateur.
 */
class QuizFingerprintTest extends QuizHttpTestCase
{
    private function quiz()
    {
        return $this->makeQuiz([
            ['question_text' => 'Q1', 'question_type' => 'qcm', 'option_a' => 'A', 'option_b' => 'B', 'option_c' => 'C', 'option_d' => 'D', 'correct_answer' => 1],
        ]);
    }

    public function test_fingerprint_works_on_a_quiz_without_any_result(): void
    {
        $fp = app(QuizDeliberationService::class)->fingerprint($this->quiz());

        $this->assertSame(40, strlen($fp));
    }

    public function test_fingerprint_works_with_participation_bonus_and_no_result(): void
    {
        // Cas qui plantait : aucune copie (Eloquent\Collection vide) + bonus de participation (chaînes)
        $quiz = $this->quiz();
        ParticipationPoint::create([
            'project_id' => $this->project->id, 'quiz_id' => $quiz->id, 'user_id' => $this->candidate->id,
            'awarded_by' => $this->manager1->id, 'points' => 2, 'awarded_on' => now()->toDateString(),
        ]);

        $service = app(QuizDeliberationService::class);
        $with = $service->fingerprint($quiz);

        $this->assertSame(40, strlen($with));
        $this->assertSame($with, $service->fingerprint($quiz), 'L\'empreinte doit être stable.');
    }

    public function test_fingerprint_changes_when_a_bonus_is_added(): void
    {
        $quiz = $this->quiz();
        $service = app(QuizDeliberationService::class);
        $before = $service->fingerprint($quiz);

        ParticipationPoint::create([
            'project_id' => $this->project->id, 'quiz_id' => $quiz->id, 'user_id' => $this->candidate->id,
            'awarded_by' => $this->manager1->id, 'points' => 1.5, 'awarded_on' => now()->toDateString(),
        ]);

        $this->assertNotSame($before, $service->fingerprint($quiz));
    }

    public function test_deciders_is_a_plain_collection(): void
    {
        $deciders = $this->quiz()->deciders();

        $this->assertNotInstanceOf(EloquentCollection::class, $deciders);
        $this->assertTrue($deciders->contains('id', $this->manager1->id));
    }

    public function test_admin_gate_accepts_every_admin_role_variant(): void
    {
        foreach (['admin', ' Admin ', 'SUPERADMIN', 'super_admin', 'Administrator'] as $role) {
            $user = User::factory()->create(['role' => $role]);
            $this->assertTrue(Gate::forUser($user)->allows('admin-only'), "Le rôle « {$role} » doit être reconnu administrateur.");
        }
    }

    public function test_admin_gate_refuses_regular_users(): void
    {
        foreach (['user', 'manager', 'member', ''] as $role) {
            $user = User::factory()->create(['role' => $role]);
            $this->assertFalse(Gate::forUser($user)->allows('admin-only'), "Le rôle « {$role} » ne doit pas être administrateur.");
        }
    }
}

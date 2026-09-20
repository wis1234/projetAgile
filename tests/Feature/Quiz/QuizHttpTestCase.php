<?php

namespace Tests\Feature\Quiz;

use App\Models\Project;
use App\Models\Quiz;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use Spatie\Permission\Models\Role;

/**
 * Base des tests HTTP du module Quiz (les tests existants appellent les services directement
 * et ne passent donc jamais par les contrôleurs). Les migrations du projet utilisent du SQL
 * MySQL : lancer avec DB_CONNECTION=mysql.
 */
abstract class QuizHttpTestCase extends BaseTestCase
{
    use RefreshDatabase;

    protected Project $project;
    protected User $manager1;
    protected User $manager2;
    protected User $candidate;

    protected function setUp(): void
    {
        parent::setUp();

        $this->withoutVite();
        config(['inertia.testing.ensure_pages_exist' => false]);

        foreach (['admin', 'manager', 'member'] as $role) {
            Role::firstOrCreate(['name' => $role, 'guard_name' => 'web']);
        }

        $this->project = Project::factory()->create();
        $this->manager1 = User::factory()->create(['name' => 'Alice Manager']);
        $this->manager2 = User::factory()->create(['name' => 'Bob Manager']);
        $this->candidate = User::factory()->create(['name' => 'Chloé Candidate']);

        foreach ([$this->manager1, $this->manager2] as $m) {
            $this->project->users()->attach($m->id, ['role' => 'manager', 'is_muted' => false]);
        }
        $this->project->users()->attach($this->candidate->id, ['role' => 'collaborator', 'is_muted' => false]);
    }

    /** Requête « Inertia » : on lit directement les props JSON, sans passer par Vite. */
    protected function inertia(User $user, string $url)
    {
        return $this->actingAs($user)->getJson($url, ['X-Inertia' => 'true']);
    }

    protected function makeQuiz(array $questions, string $title = 'Quiz test'): Quiz
    {
        $quiz = Quiz::create([
            'project_id' => $this->project->id,
            'created_by' => $this->manager1->id,
            'title' => $title,
            'quiz_type' => 'mixed',
            'duration_minutes' => 10,
            'max_attempts' => 2,
            'is_active' => true,
            'show_results' => true,
        ]);

        foreach ($questions as $i => $q) {
            $quiz->questions()->create($q + ['order' => $i + 1]);
        }

        return $quiz->refresh();
    }

    protected function qcm(int $correct = 0): array
    {
        return ['question_text' => 'QCM ?', 'question_type' => 'qcm', 'option_a' => 'A', 'option_b' => 'B', 'correct_answer' => $correct];
    }

    protected function written(string $text = 'Expliquez'): array
    {
        return ['question_text' => $text, 'question_type' => 'written'];
    }

    protected function quizUrl(Quiz $quiz, string $suffix = ''): string
    {
        return "/projects/{$this->project->id}/quizzes/{$quiz->id}" . $suffix;
    }
}

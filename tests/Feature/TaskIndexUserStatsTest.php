<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskIndexUserStatsTest extends TestCase
{
    use RefreshDatabase;

    public function test_index_includes_user_stats_for_assigned_tasks(): void
    {
        $user = User::factory()->create();
        $member = User::factory()->create();
        $project = Project::factory()->create();

        $project->users()->attach($user->id, ['role' => 'manager']);
        $project->users()->attach($member->id, ['role' => 'member']);

        Task::factory()->create([
            'project_id' => $project->id,
            'assigned_to' => $member->id,
            'status' => 'done',
            'due_date' => now()->subDay()->toDateTimeString(),
            'updated_at' => now()->toDateTimeString(),
        ]);

        Task::factory()->create([
            'project_id' => $project->id,
            'assigned_to' => $member->id,
            'status' => 'in_progress',
        ]);

        $this->actingAs($user);

        $response = $this->get(route('tasks.index'));

        $response->assertOk();
        $response->assertInertia(fn ($page) => $page
            ->where('userStats.0.user.name', $member->name)
            ->where('userStats.0.total', 2)
            ->where('userStats.0.done', 1)
            ->where('userStats.0.in_progress', 1)
        );
    }
}

<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProjectPlanningExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_project_member_can_download_planning_pdf(): void
    {
        $user = User::factory()->create();
        $project = Project::factory()->create();
        $project->users()->attach($user->id, ['role' => 'manager']);

        Sprint::factory()->create([
            'project_id' => $project->id,
            'name' => 'Sprint 1',
            'start_date' => now()->subDays(5),
            'end_date' => now()->addDays(10),
        ]);

        Task::factory()->create([
            'project_id' => $project->id,
            'assigned_to' => $user->id,
            'title' => 'Planifier les livrables',
            'priority' => 'high',
            'status' => 'in_progress',
            'due_date' => now()->addDays(3),
        ]);

        $response = $this->actingAs($user)
            ->get(route('projects.planning', ['id' => $project->id, 'format' => 'pdf']));

        $response->assertOk();
        $response->assertHeader('content-type', 'application/pdf');
    }
}

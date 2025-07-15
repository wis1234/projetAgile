<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Task;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KanbanTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function kanban_route_requires_authentication()
    {
        $response = $this->get('/tasks/kanban');
        $response->assertRedirect('/login');
    }

    /** @test */
    public function authenticated_user_can_access_kanban_page()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        Task::factory()->count(3)->create(['status' => 'todo']);
        $response = $this->get('/tasks/kanban');
        $response->assertStatus(200);
        $response->assertSee('Kanban'); // Vérifie que le mot Kanban est dans la page
    }
} 
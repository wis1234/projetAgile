<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class InboxPrivateChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_users_from_the_same_project_can_start_a_private_inbox_chat(): void
    {
        $project = Project::factory()->create();
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        $project->users()->attach([
            $userA->id => ['role' => 'manager'],
            $userB->id => ['role' => 'member'],
        ]);

        $this->actingAs($userA, 'web');

        $this->getJson('/api/inbox/users')
            ->assertOk()
            ->assertJsonFragment(['id' => $userB->id]);

        $this->postJson('/api/inbox/conversations/' . $userB->id . '/messages', [
            'content' => 'Bonjour, on peut discuter ici ?',
        ])
            ->assertOk()
            ->assertJsonPath('message.content', 'Bonjour, on peut discuter ici ?');
    }
}

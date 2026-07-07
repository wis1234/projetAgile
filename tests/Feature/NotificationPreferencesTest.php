<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class NotificationPreferencesTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_their_notification_preferences(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->patch(route('profile.preferences.update'), [
            'notification_preferences' => [
                'task_updates' => false,
                'project_updates' => true,
                'file_updates' => false,
                'meeting_updates' => true,
            ],
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
        ]);

        $user->refresh();
        $this->assertFalse($user->notification_preferences['task_updates']);
        $this->assertTrue($user->notification_preferences['project_updates']);
        $this->assertFalse($user->notification_preferences['file_updates']);
        $this->assertTrue($user->notification_preferences['meeting_updates']);
    }
}

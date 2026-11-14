<?php

namespace Tests\Feature;

use App\Models\Project;
use App\Models\ProjectAnnouncement;
use App\Models\User;
use App\Notifications\ProjaNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;
use Tests\TestCase;

class ProjectAnnouncementsTest extends TestCase
{
    use RefreshDatabase;

    public function test_project_manager_can_publish_and_notify_project_members(): void
    {
        Notification::fake();

        [$project, $manager, $member] = $this->projectWithMembers();

        $this->actingAs($manager)
            ->post(route('projects.announcements.store', $project), [
                'title' => 'Réunion de lancement',
                'body' => 'La réunion aura lieu vendredi à 10 h.',
            ])
            ->assertRedirect();

        $announcement = ProjectAnnouncement::query()->where('project_id', $project->id)->firstOrFail();
        $this->assertSame('Réunion de lancement', $announcement->title);
        Notification::assertSentTo($manager, ProjaNotification::class);
        Notification::assertSentTo($member, ProjaNotification::class);
    }

    public function test_project_collaborator_cannot_publish_or_manage_announcements(): void
    {
        [$project, , $member] = $this->projectWithMembers();

        $this->actingAs($member)
            ->post(route('projects.announcements.store', $project), [
                'title' => 'Annonce interdite',
                'body' => 'Un membre ne peut pas publier.',
            ])
            ->assertForbidden();

        $announcement = $project->announcements()->create([
            'title' => 'Annonce existante',
            'body' => 'Visible aux membres seulement.',
        ]);

        $this->actingAs($member)
            ->delete(route('projects.announcements.destroy', [$project, $announcement]))
            ->assertForbidden();

        $this->assertDatabaseHas('project_announcements', ['id' => $announcement->id]);
    }

    public function test_only_unmuted_project_members_see_announcements_in_the_feed(): void
    {
        [$project, $manager, $member] = $this->projectWithMembers();
        $announcement = $project->announcements()->create([
            'title' => 'Information privée',
            'body' => 'Cette annonce appartient au projet.',
            'author_id' => $manager->id,
        ]);
        $outsider = User::factory()->create();

        $this->actingAs($member)
            ->get(route('project-announcements.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Announcements/Index')
                ->has('announcements.data', 1)
                ->where('announcements.data.0.id', $announcement->id));

        $this->actingAs($outsider)
            ->get(route('project-announcements.index'))
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Announcements/Index')
                ->has('announcements.data', 0));

        $mutedMember = User::factory()->create();
        $project->users()->attach($mutedMember->id, ['role' => 'collaborator', 'is_muted' => true]);
        $this->actingAs($mutedMember)
            ->get(route('project-announcements.index'))
            ->assertInertia(fn (Assert $page) => $page
                ->component('Announcements/Index')
                ->has('announcements.data', 0));
    }

    private function projectWithMembers(): array
    {
        $project = Project::factory()->create();
        $manager = User::factory()->create();
        $member = User::factory()->create();

        $project->users()->attach($manager->id, ['role' => 'manager', 'is_muted' => false]);
        $project->users()->attach($member->id, ['role' => 'collaborator', 'is_muted' => false]);

        return [$project, $manager, $member];
    }
}

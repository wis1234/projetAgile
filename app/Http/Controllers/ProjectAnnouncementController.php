<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\ProjectAnnouncement;
use App\Notifications\ProjaNotification;
use App\Notifications\ProjectAnnouncementEmailNotification;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ProjectAnnouncementController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $projectFilter = null;

        if ($request->filled('project_id')) {
            $validated = $request->validate([
                'project_id' => ['required', 'integer', 'min:1'],
            ]);

            $projectFilter = Project::query()
                ->whereKey($validated['project_id'])
                ->whereHas('users', function ($query) use ($user) {
                    $query->where('users.id', $user->id)
                        ->where(function ($membership) {
                            $membership->whereNull('project_user.is_muted')
                                ->orWhere('project_user.is_muted', false);
                        });
                })
                ->firstOrFail();
        }

        $announcements = ProjectAnnouncement::query()
            ->when($projectFilter, fn ($query) => $query->where('project_id', $projectFilter->id))
            ->whereHas('project.users', function ($query) use ($user) {
                $query->where('users.id', $user->id)
                    ->where(function ($membership) {
                        $membership->whereNull('project_user.is_muted')
                            ->orWhere('project_user.is_muted', false);
                    });
            })
            ->with(['project:id,name', 'author:id,name'])
            ->latest()
            ->paginate(20)
            ->through(fn (ProjectAnnouncement $announcement) => $this->serialize($announcement));

        return Inertia::render('Announcements/Index', [
            'announcements' => $announcements,
            'projectFilter' => $projectFilter ? [
                'id' => $projectFilter->id,
                'name' => $projectFilter->name,
            ] : null,
        ]);
    }

    public function store(Request $request, Project $project)
    {
        $this->authorizeProjectAccess($request, $project, true);

        $validated = $request->validate([
            'title' => ['required', 'string', 'max:180'],
            'body' => ['required', 'string', 'max:10000'],
        ]);

        $announcement = $project->announcements()->create([
            ...$validated,
            'author_id' => $request->user()->id,
        ]);

        $projectUrl = route('projects.show', $project).'#announcements';
        $authorName = $request->user()->name;
        $project->users()
            ->where(function ($query) {
                $query->whereNull('project_user.is_muted')
                    ->orWhere('project_user.is_muted', false);
            })
            ->get()
            ->each(function ($member) use ($announcement, $project, $projectUrl, $authorName) {
                $member->notify(new ProjaNotification(
                    'Nouveau communiqué dans '.$project->name,
                    'Un nouveau communiqué a été publié. Ouvrez le projet pour le consulter.',
                    $projectUrl,
                    '/logo-proja.png',
                    'project-announcement-'.$announcement->id,
                ));
                $member->notify(new ProjectAnnouncementEmailNotification(
                    $announcement,
                    $project,
                    $authorName,
                ));
            });

        return back()->with('success', 'Le communiqué a été publié et les membres du projet ont été notifiés.');
    }

    public function update(Request $request, Project $project, ProjectAnnouncement $announcement)
    {
        $this->authorizeProjectAccess($request, $project, true);
        abort_unless($announcement->project_id === $project->id, 404);

        $announcement->update($request->validate([
            'title' => ['required', 'string', 'max:180'],
            'body' => ['required', 'string', 'max:10000'],
        ]));

        return back()->with('success', 'Le communiqué a été mis à jour.');
    }

    public function destroy(Request $request, Project $project, ProjectAnnouncement $announcement)
    {
        $this->authorizeProjectAccess($request, $project, true);
        abort_unless($announcement->project_id === $project->id, 404);

        $announcement->delete();

        return back()->with('success', 'Le communiqué a été supprimé.');
    }

    private function authorizeProjectAccess(Request $request, Project $project, bool $manage = false): void
    {
        $membership = $project->users()
            ->where('users.id', $request->user()->id)
            ->first();

        abort_unless($membership && !$membership->pivot->is_muted, 404);

        if ($manage && !$project->userCanManageAnnouncements($request->user())) {
            abort(403);
        }
    }

    private function serialize(ProjectAnnouncement $announcement): array
    {
        return [
            'id' => $announcement->id,
            'title' => $announcement->title,
            'body' => $announcement->body,
            'created_at' => $announcement->created_at?->diffForHumans(),
            'project' => [
                'id' => $announcement->project->id,
                'name' => $announcement->project->name,
            ],
            'author' => $announcement->author?->name,
        ];
    }
}

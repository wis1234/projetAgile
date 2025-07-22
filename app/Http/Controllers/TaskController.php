<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use Inertia\Inertia;
use App\Models\Project;
use App\Models\Sprint;
use App\Events\TaskUpdated;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Notifications\UserActionMailNotification;

class TaskController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        try {
            $this->authorize('viewAny', Task::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        $query = Task::with(['assignedUser', 'project', 'sprint'])->whereHas('project', function ($q) {
            $q->whereHas('users', function ($q2) {
                $q2->where('user_id', auth()->id());
            });
        });

        if ($request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }
        $tasks = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'filters' => $request->only('search'),
        ]);
    }

    public function create()
    {
        try {
            $this->authorize('create', Task::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $currentUser = auth()->user();
        $projects = $currentUser->hasRole('admin')
            ? Project::with(['users:id,name'])->get(['id', 'name'])
            : $currentUser->projects()->with(['users:id,name'])->wherePivot('role', 'manager')->get(['projects.id', 'projects.name']);
        $sprints = Sprint::whereIn('project_id', $projects->pluck('id'))->get();
        return Inertia::render('Tasks/Create', [
            'projects' => $projects,
            'sprints' => $sprints,
        ]);
    }

    public function store(Request $request)
    {
        try {
            $this->authorize('create', Task::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'project_id' => 'required|exists:projects,id',
            'sprint_id' => 'required|exists:sprints,id',
            'assigned_to' => 'required|exists:users,id',
            'status' => 'required|in:todo,in_progress,done',
            'description' => 'nullable|string',
            'due_date' => 'nullable|date',
            'priority' => 'nullable|string',
        ]);
        // Valeurs par défaut si non renseignées
        $validated['description'] = $request->input('description', '');
        $validated['due_date'] = $request->input('due_date', null);
        $validated['priority'] = $request->input('priority', '');
        $task = Task::create($validated);

        // Notifier l'utilisateur assigné
        $assignedUser = \App\Models\User::find($validated['assigned_to']);
        $project = \App\Models\Project::find($validated['project_id']);
        $subject = 'Nouvelle tâche assignée dans le projet : ' . $project->name;
        $message = 'Bonjour ' . $assignedUser->name . ',<br>Vous avez été assigné à la tâche <b>' . $task->title . '</b> dans le projet <b>' . $project->name . '</b>.';
        $actionUrl = url('/tasks/' . $task->id);
        $actionText = 'Voir la tâche';
        $assignedUser->notify(new UserActionMailNotification($subject, $message, $actionUrl, $actionText, [
            'task_id' => $task->id,
            'project_id' => $project->id,
        ]));

        // Notifier les autres membres du projet (sauf l'assigné)
        $otherMembers = $project->users()->where('users.id', '!=', $assignedUser->id)->get();
        foreach ($otherMembers as $member) {
            $subject = 'Nouvelle tâche créée dans le projet : ' . $project->name;
            $message = 'Bonjour ' . $member->name . ',<br>La tâche <b>' . $task->title . '</b> a été créée et assignée à <b>' . $assignedUser->name . '</b> dans le projet <b>' . $project->name . '</b>.';
            $member->notify(new UserActionMailNotification($subject, $message, $actionUrl, $actionText, [
                'task_id' => $task->id,
                'project_id' => $project->id,
            ]));
        }

        return redirect()->route('tasks.index');
    }

    public function show(Task $task)
    {
        try {
            $this->authorize('view', $task);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $task->load(['project', 'sprint', 'assignedUser']);
        return Inertia::render('Tasks/Show', ['task' => $task]);
    }

    public function edit(Task $task)
    {
        try {
            $this->authorize('update', $task);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $projects = Project::whereHas('users', function ($q) {
            $q->where('user_id', auth()->id())->whereIn('role', ['admin', 'manager']);
        })->get();
        $sprints = Sprint::whereIn('project_id', $projects->pluck('id'))->get();

        return Inertia::render('Tasks/Edit', [
            'task' => $task,
            'projects' => $projects,
            'sprints' => $sprints,
        ]);
    }

    public function update(Request $request, Task $task)
    {
        try {
            $this->authorize('update', $task);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'status' => 'required|in:todo,in_progress,done',
        ]);
        $task->update($validated);
        return redirect()->route('tasks.index');
    }

    public function destroy(Task $task)
    {
        try {
            $this->authorize('delete', $task);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $task->delete();
        return redirect()->route('tasks.index');
    }

    public function kanban()
    {
        try {
            $this->authorize('viewAny', Task::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $tasks = Task::whereHas('project', function ($q) {
            $q->whereHas('users', function ($q2) {
                $q2->where('user_id', auth()->id());
            });
        })->get()->groupBy('status');

        return Inertia::render('Tasks/Kanban', ['tasks' => $tasks]);
    }

    public function comment(Request $request, Task $task)
    {
        try {
            $this->authorize('comment', $task);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        // ...
    }

    public function uploadFile(Request $request, Task $task)
    {
        try {
            $this->authorize('uploadFile', $task);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        // ...
    }
}

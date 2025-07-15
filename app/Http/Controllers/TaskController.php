<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use Inertia\Inertia;
use App\Models\User;
use App\Models\Project;
use App\Models\Sprint;
use App\Events\TaskUpdated;

class TaskController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Task::with(['assignedUser', 'project']);
        if ($request->search) {
            $query->where('title', 'like', '%'.$request->search.'%');
        }
        if ($request->created_from) {
            $query->whereDate('created_at', '>=', $request->created_from);
        }
        if ($request->created_to) {
            $query->whereDate('created_at', '<=', $request->created_to);
        }
        $tasks = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();
        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'filters' => $request->only('search', 'created_from', 'created_to'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $projects = Project::with('users:id,name')->get(['id', 'name'])->map(function($project) {
            return [
                'id' => $project->id,
                'name' => $project->name,
                'users' => $project->users->map(function($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                    ];
                })->values(),
            ];
        })->values();

        $sprints = Sprint::all(['id', 'name'])->map(function($sprint) {
            return [
                'id' => $sprint->id,
                'name' => $sprint->name,
            ];
        })->values();

        return Inertia::render('Tasks/Create', [
            'projects' => $projects,
            'sprints' => $sprints,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'project_id' => 'required|exists:projects,id',
            'sprint_id' => 'required|exists:sprints,id',
            'assigned_to' => 'required|exists:users,id',
            'status' => 'required|in:todo,in_progress,done',
            'priority' => 'nullable|string',
            'due_date' => 'nullable|date',
        ]);
        $task = Task::create($validated);
        activity_log('create', 'Création tâche', $task);
        event(new TaskUpdated($task));
        return redirect()->route('tasks.index')->with('success', 'Tâche créée avec succès');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $task = Task::with(['project', 'sprint', 'assignedUser'])->findOrFail($id);
        return Inertia::render('Tasks/Show', ['task' => $task]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $task = Task::findOrFail($id);
        $projects = Project::with('users:id,name')->get(['id', 'name']);
        $sprints = Sprint::all(['id', 'name']);
        return Inertia::render('Tasks/Edit', [
            'task' => $task,
            'projects' => $projects,
            'sprints' => $sprints,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $task = Task::findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'sometimes|required|in:todo,in_progress,done',
            'position' => 'nullable|integer',
            // autres champs si besoin
        ]);

        $task->update($validated);
        activity_log('update', 'Modification tâche', $task);
        event(new TaskUpdated($task));

        return redirect()->route('tasks.index')->with('success', 'Tâche mise à jour avec succès');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $task = Task::findOrFail($id);
        $task->delete();
        activity_log('delete', 'Suppression tâche', $task);
        event(new TaskUpdated($task));
        return redirect()->route('tasks.index');
    }

    public function kanban()
    {
        $tasks = Task::orderBy('position')->get()->groupBy('status');
        return Inertia::render('Tasks/Kanban', [
            'tasks' => $tasks,
        ]);
    }
}

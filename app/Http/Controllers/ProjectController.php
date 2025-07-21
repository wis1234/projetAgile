<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use Inertia\Inertia;
use App\Events\ProjectUpdated;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $query = Project::query();
        if ($request->search) {
            $query->where('name', 'like', '%'.$request->search.'%');
        }
        $projects = $query->withCount(['tasks', 'users'])
                         ->orderBy('created_at', 'desc')
                         ->paginate(10)
                         ->withQueryString();
        return Inertia::render('Projects/Index', [
            'projects' => $projects,
            'filters' => $request->only('search'),
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        return Inertia::render('Projects/Create');
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);
        $project = Project::create($validated);
        event(new ProjectUpdated($project));
        activity_log('create', 'Création projet', $project);
        return redirect()->route('projects.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $project = Project::with('users')->findOrFail($id);
        if (!$project->isMember(auth()->user())) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $tasks = $project->tasks()->with(['assignedUser', 'sprint'])->orderBy('created_at', 'desc')->get();
        return Inertia::render('Projects/Show', [
            'project' => $project,
            'tasks' => $tasks,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $project = Project::findOrFail($id);
        if (!$project->isMember(auth()->user())) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        return Inertia::render('Projects/Edit', [
            'project' => $project,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $project = Project::findOrFail($id);
        if (!$project->isMember(auth()->user())) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);
        $project->update($validated);
        event(new ProjectUpdated($project));
        activity_log('update', 'Modification projet', $project);
        return redirect()->route('projects.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $project = Project::findOrFail($id);
        if (!$project->isMember(auth()->user())) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $project->delete();
        event(new ProjectUpdated($project));
        activity_log('delete', 'Suppression projet', $project);
        return redirect()->route('projects.index');
    }

    /**
     * API: Get project details as JSON (for dynamic panel)
     */
    public function apiShow($id)
    {
        $project = Project::with('users')->findOrFail($id);
        $tasks = $project->tasks()->with(['assignedUser', 'sprint'])->orderBy('created_at', 'desc')->get();
        return response()->json([
            'id' => $project->id,
            'name' => $project->name,
            'users' => $project->users,
            'tasks' => $tasks,
        ]);
    }

    public function manageMembers($id)
    {
        $project = Project::findOrFail($id);
        $this->authorize('manageMembers', $project);
        // ... logique pour gérer les membres ...
    }
}

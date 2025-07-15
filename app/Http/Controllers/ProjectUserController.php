<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Validation\Rule;

class ProjectUserController extends Controller
{
    // Liste des rôles autorisés (dynamique)
    const ALLOWED_ROLES = ['member', 'manager', 'observer'];

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        $projects = Project::with('users')->get();
        return Inertia::render('ProjectUsers/Index', [
            'projects' => $projects,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $projects = Project::all(['id', 'name']);
        $users = User::all(['id', 'name']);
        return Inertia::render('ProjectUsers/Create', [
            'projects' => $projects,
            'users' => $users,
            'roles' => self::ALLOWED_ROLES,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'user_id' => 'required|exists:users,id',
            'role' => ['required', 'string', 'max:50', Rule::in(self::ALLOWED_ROLES)],
        ]);
        $project = Project::findOrFail($validated['project_id']);
        $project->users()->attach($validated['user_id'], ['role' => $validated['role']]);
        return redirect()->route('project-users.index');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $project = Project::with('users')->findOrFail($id);
        return Inertia::render('ProjectUsers/Show', [
            'project' => $project,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $project = Project::with('users')->findOrFail($id);
        $users = User::all(['id', 'name']);
        return Inertia::render('ProjectUsers/Edit', [
            'project' => $project,
            'users' => $users,
            'roles' => self::ALLOWED_ROLES,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $project = Project::findOrFail($id);
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'role' => ['required', 'string', 'max:50', Rule::in(self::ALLOWED_ROLES)],
        ]);
        $project->users()->updateExistingPivot($validated['user_id'], ['role' => $validated['role']]);
        return redirect()->route('project-users.index');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // Pour supprimer un membre d'un projet, il faut l'ID du projet et de l'utilisateur
        $projectId = request('project_id');
        $userId = request('user_id');
        $project = Project::findOrFail($projectId);
        $project->users()->detach($userId);
        return redirect()->route('project-users.index');
    }
}

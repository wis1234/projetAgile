<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Validation\Rule;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Notifications\UserActionMailNotification;
use Illuminate\Support\Facades\Notification;

class ProjectUserController extends Controller
{
    use AuthorizesRequests;
    // Liste des rôles autorisés (dynamique)
    const ALLOWED_ROLES = ['member', 'manager', 'observer'];

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            $this->authorize('viewAny', Project::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
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
        try {
            $this->authorize('create', Project::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
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
        try {
            $this->authorize('create', Project::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }

        $validated = $request->validate([
            'project_id' => 'required|exists:projects,id',
            'user_id' => 'required|exists:users,id',
            'role' => ['required', 'string', Rule::in(self::ALLOWED_ROLES)],
        ]);

        $project = Project::findOrFail($validated['project_id']);
        $user = User::findOrFail($validated['user_id']);

        // Vérifier si l'utilisateur est déjà membre du projet
        if ($project->users()->where('user_id', $user->id)->exists()) {
            return redirect()->back()->with('error', 'Cet utilisateur est déjà membre de ce projet.');
        }

        // Ajouter l'utilisateur au projet avec le rôle spécifié
        $project->users()->attach($user->id, [
            'role' => $validated['role'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Envoyer une notification à l'utilisateur ajouté
        $user->notify(new \App\Notifications\ProjectNotification('user_added', [
            'project_id' => $project->id,
            'project_name' => $project->name,
            'project_url' => route('projects.show', $project->id),
            'role' => $validated['role'],
            'added_by' => auth()->user()->name,
        ]));

        // Notifier les autres membres du projet
        $project->notifyMembers('user_added_to_project', [
            'user_id' => $user->id,
            'user_name' => $user->name,
            'user_email' => $user->email,
            'role' => $validated['role'],
            'added_by' => auth()->user()->name,
        ]);

        return redirect()->route('project-users.index')
            ->with('success', 'Utilisateur ajouté au projet avec succès.');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $project = Project::with('users')->findOrFail($id);
        try {
            $this->authorize('view', $project);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
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
        try {
            $this->authorize('update', $project);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
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
        $this->authorize('manageMembers', $project);
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
        $this->authorize('manageMembers', $project);
        $project->users()->detach($userId);
        return redirect()->route('project-users.index');
    }
}

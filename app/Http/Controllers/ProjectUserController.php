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
        
        // Get only projects where the authenticated user is a member with pagination
        $perPage = request('per_page', 10);
        $projects = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->with(['users' => function($query) {
            $query->withPivot('role');
        }])
        ->withCount('tasks')
        ->orderBy('created_at', 'desc')
        ->paginate($perPage);

        // Get the pagination data
        $paginationData = $projects->toArray();
        
        return Inertia::render('ProjectUsers/Index', [
            'projects' => $paginationData,
            'filters' => request()->only(['search', 'per_page'])
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
        
        // Only show projects where the authenticated user is a member
        $projects = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->get(['id', 'name']);
        
        // Afficher tous les utilisateurs sauf l'utilisateur actuel
        $users = User::where('id', '!=', auth()->id())
            ->orderBy('name')
            ->get(['id', 'name', 'email']);
        
        // Log pour débogage
        \Log::info('Utilisateurs chargés pour le formulaire d\'ajout de membre:', [
            'count' => $users->count(),
            'users' => $users->toArray()
        ]);
        
        return Inertia::render('ProjectUsers/Create', [
            'projects' => $projects,
            'users' => $users,
            'roles' => self::ALLOWED_ROLES,
            'debug' => [
                'users_count' => $users->count(),
                'current_user_id' => auth()->id()
            ]
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
            'project_id' => [
                'required',
                'exists:projects,id',
                // Vérifier que l'utilisateur connecté est membre du projet
                Rule::exists('project_user', 'project_id')->where('user_id', auth()->id())
            ],
            'user_id' => [
                'required',
                'exists:users,id',
                // Vérifier que l'utilisateur n'est pas déjà membre de ce projet
                function($attribute, $value, $fail) use ($request) {
                    $exists = \DB::table('project_user')
                        ->where('project_id', $request->project_id)
                        ->where('user_id', $value)
                        ->exists();
                    
                    if ($exists) {
                        $fail('Cet utilisateur est déjà membre de ce projet.');
                    }
                },
                // S'assurer qu'on ne s'ajoute pas soi-même
                function($attribute, $value, $fail) {
                    if ($value == auth()->id()) {
                        $fail('Vous ne pouvez pas vous ajouter vous-même.');
                    }
                }
            ],
            'role' => ['required', 'string', Rule::in(self::ALLOWED_ROLES)],
        ]);

        $project = Project::findOrFail($validated['project_id']);
        $user = User::findOrFail($validated['user_id']);

        // Add the user to the project with the specified role
        $project->users()->attach($user->id, [
            'role' => $validated['role'],
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // Send a notification to the added user
        $user->notify(new \App\Notifications\ProjectNotification('user_added', [
            'project_id' => $project->id,
            'project_name' => $project->name,
            'project_url' => route('projects.show', $project->id),
            'role' => $validated['role'],
            'added_by' => auth()->user()->name,
        ]));

        // Notify other project members
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
        // Get the project and ensure the authenticated user is a member
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->with(['users' => function($query) {
            $query->withPivot('role');
        }])->findOrFail($id);
        
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
        // Get the project and ensure the authenticated user is a member
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->with(['users' => function($query) {
            $query->withPivot('role');
        }])->findOrFail($id);
        
        try {
            $this->authorize('update', $project);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        
        // Only get users who are already members of the project
        $users = $project->users()->get(['users.id', 'users.name']);
        
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
        // Get the project and ensure the authenticated user is a member
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->findOrFail($id);
        
        $this->authorize('manageMembers', $project);
        
        $validated = $request->validate([
            'user_id' => [
                'required',
                'exists:users,id',
                // Ensure the user is a member of this project
                Rule::exists('project_user', 'user_id')->where('project_id', $id)
            ],
            'role' => ['required', 'string', 'max:50', Rule::in(self::ALLOWED_ROLES)],
        ]);
        
        $project->users()->updateExistingPivot($validated['user_id'], [
            'role' => $validated['role'],
            'updated_at' => now()
        ]);
        
        return redirect()->route('project-users.index')
            ->with('success', 'Le rôle du membre a été mis à jour avec succès.');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // Get the project and ensure the authenticated user is a member
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->findOrFail($id);
        
        $this->authorize('manageMembers', $project);
        
        $validated = request()->validate([
            'user_id' => [
                'required',
                'exists:users,id',
                // Ensure the user is a member of this project
                Rule::exists('project_user', 'user_id')->where('project_id', $id)
            ]
        ]);
        
        $project->users()->detach($validated['user_id']);
        
        return redirect()->route('project-users.index')
            ->with('success', 'Le membre a été retiré du projet avec succès.');
    }
}

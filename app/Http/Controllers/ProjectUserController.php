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
use Illuminate\Support\Facades\DB;

class ProjectUserController extends Controller
{
    use AuthorizesRequests;
    // Liste des rôles autorisés (dynamique)
    const ALLOWED_ROLES = ['member', 'manager', 'observer'];

    /**
     * Display a listing of members (users) with their roles in common projects.
     */
    public function index(Request $request)
    {
        try {
            $this->authorize('viewAny', Project::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }

        $userId = auth()->id();

        // Sous-requête : projets où l'utilisateur courant est membre
        $myProjectsIds = Project::whereHas('users', fn($q) => $q->where('user_id', $userId))
                                ->pluck('id');

        // Requête de base : tous les utilisateurs qui sont membres d'au moins un de ces projets
        $query = User::whereHas('projects', function ($q) use ($myProjectsIds) {
            $q->whereIn('projects.id', $myProjectsIds);
        })->with(['projects' => function ($q) use ($myProjectsIds) {
            $q->whereIn('projects.id', $myProjectsIds)
              ->withPivot('role');
        }]);

        // Filtres reçus
        $filters = $request->only(['search', 'role', 'project_id', 'project_status', 'sort_by', 'sort_dir']);
        $search = $filters['search'] ?? null;
        $role   = $filters['role'] ?? null;
        $projectId = $filters['project_id'] ?? null;
        $projectStatus = $filters['project_status'] ?? null;

        // Filtre par nom ou email de l'utilisateur
        if (!empty($search)) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        // Filtre par rôle dans n'importe quel projet commun
        if (!empty($role)) {
            $query->whereHas('projects', function ($q) use ($myProjectsIds, $role) {
                $q->whereIn('projects.id', $myProjectsIds)
                  ->where('project_user.role', $role);
            });
        }

        // Filtre par projet spécifique (l'utilisateur doit être membre de ce projet)
        if (!empty($projectId)) {
            $query->whereHas('projects', function ($q) use ($projectId) {
                $q->where('projects.id', $projectId);
            });
        }

        // Filtre par statut du projet (l'utilisateur doit être membre d'au moins un projet avec ce statut)
        if (!empty($projectStatus)) {
            $query->whereHas('projects', function ($q) use ($projectStatus) {
                $q->where('status', $projectStatus);
            });
        }

        // Tri autorisé
        $sortBy  = $filters['sort_by'] ?? 'name';
        $sortDir = $filters['sort_dir'] ?? 'asc';
        $allowedSorts = ['name', 'email', 'created_at'];
        if (in_array($sortBy, $allowedSorts)) {
            $query->orderBy($sortBy, $sortDir);
        } else {
            $query->orderBy('name', 'asc');
        }

        // Pagination
        $perPage = $request->input('per_page', 12);
        $members = $query->paginate($perPage)->withQueryString();

        // Transformation des données
        $members->through(function ($user) use ($myProjectsIds) {
            // Ne garder que les projets communs avec l'utilisateur courant
            $commonProjects = $user->projects->filter(function ($project) use ($myProjectsIds) {
                return $myProjectsIds->contains($project->id);
            })->values();

            return [
                'id'         => $user->id,
                'name'       => $user->name,
                'email'      => $user->email,
                'avatar'     => $user->profile_photo_url ?? null,
                'created_at' => $user->created_at,
                'common_projects' => $commonProjects->map(fn($p) => [
                    'id'   => $p->id,
                    'name' => $p->name,
                    'status' => $p->status,
                    'role' => $p->pivot->role,
                ]),
            ];
        });

        // Statistiques globales pour les cartes récapitulatives (optionnel)
        $globalStats = [
            'total_members' => User::whereHas('projects', fn($q) => $q->whereIn('projects.id', $myProjectsIds))->count(),
            'total_projects' => Project::whereHas('users', fn($q) => $q->where('user_id', $userId))->count(),
            'total_roles' => DB::table('project_user')
                ->whereIn('project_id', $myProjectsIds)
                ->select('role', DB::raw('count(distinct user_id) as count'))
                ->groupBy('role')
                ->get()
                ->pluck('count', 'role')
                ->toArray(),
        ];

        // Liste des projets pour le filtre
        $projectsList = Project::whereHas('users', fn($q) => $q->where('user_id', $userId))
                               ->get(['id', 'name', 'status']);

        return Inertia::render('ProjectUsers/Index', [
            'members'   => $members,
            'filters'   => $filters,
            'globalStats' => $globalStats,
            'projectsList' => $projectsList,
            'allowedRoles' => self::ALLOWED_ROLES,
        ]);
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create(Request $request)
    {
        $user = auth()->user();
        
        if ($user->hasRole('admin')) {
            $projects = Project::all(['id', 'name']);
        } else {
            $projects = Project::whereHas('users', function($query) use ($user) {
                $query->where('project_user.user_id', $user->id)
                      ->where('project_user.role', 'manager');
            })->get(['id', 'name']);
        }
        
        if ($projects->isEmpty()) {
            return Inertia::render('Error403', [
                'message' => 'Vous n\'êtes pas autorisé à ajouter des membres à un projet.'
            ])->toResponse(request())->setStatusCode(403);
        }
        
        // Récupérer le project_id depuis l'URL (query string)
        $selectedProjectId = $request->query('project_id');
        
        // Vérifier que le projet existe et que l'utilisateur a le droit de l'utiliser
        if ($selectedProjectId && !$projects->contains('id', (int)$selectedProjectId)) {
            $selectedProjectId = null;
        }
        
        return Inertia::render('ProjectUsers/Create', [
            'projects' => $projects,
            'roles' => self::ALLOWED_ROLES,
            'selectedProjectId' => $selectedProjectId,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
public function store(Request $request)
{
    $project = Project::findOrFail($request->project_id);
    
    try {
        $this->authorize('manageMembers', $project);
    } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
        if ($request->wantsJson()) {
            return response()->json([
                'success' => false,
                'message' => 'Non autorisé à ajouter des membres à ce projet.'
            ], 403);
        }
        return redirect()->back()->with('error', 'Non autorisé à ajouter des membres à ce projet.');
    }

    $validated = $request->validate([
        'project_id' => [
            'required',
            'exists:projects,id',
            Rule::exists('project_user', 'project_id')->where('user_id', auth()->id())
        ],
        'user_id' => [
            'required',
            'exists:users,id',
            function($attribute, $value, $fail) use ($request) {
                $exists = DB::table('project_user')
                    ->where('project_id', $request->project_id)
                    ->where('user_id', $value)
                    ->exists();
                if ($exists) {
                    $fail('Cet utilisateur est déjà membre de ce projet.');
                }
            },
            function($attribute, $value, $fail) {
                if ($value == auth()->id()) {
                    $fail('Vous ne pouvez pas vous ajouter vous-même.');
                }
            }
        ],
        'role' => ['required', 'string', Rule::in(self::ALLOWED_ROLES)],
    ]);

    $user = User::findOrFail($validated['user_id']);

    $project->users()->attach($user->id, [
        'role' => $validated['role'],
        'created_at' => now(),
        'updated_at' => now(),
    ]);

    $user->notify(new \App\Notifications\ProjectNotification('user_added', [
        'project_id' => $project->id,
        'project_name' => $project->name,
        'project_url' => route('projects.show', $project->id),
        'role' => $validated['role'],
        'added_by' => auth()->user()->name,
    ]));

    $project->notifyMembers('user_added_to_project', [
        'user_id' => $user->id,
        'user_name' => $user->name,
        'user_email' => $user->email,
        'role' => $validated['role'],
        'added_by' => auth()->user()->name,
    ]);

    if ($request->wantsJson()) {
        return response()->json([
            'success' => true,
            'message' => 'Utilisateur ajouté au projet avec succès.',
            'redirect' => route('projects.show', $project->id) // ← redirige vers la page du projet
        ]);
    }

    return redirect()->route('projects.show', $project->id) // ← redirige vers la page du projet
        ->with('success', 'Utilisateur ajouté au projet avec succès.');
}

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->with(['users' => function($query) {
            $query->withPivot(['role', 'is_muted']);
        }])->withCount('tasks')
        ->findOrFail($id);
        
        try {
            $this->authorize('view', $project);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        
        $project->users->each(function($user) {
            if (!isset($user->pivot->is_muted)) {
                $user->pivot->is_muted = false;
            }
        });
        
        $authUser = auth()->user();
        
        return Inertia::render('ProjectUsers/Show', [
            'project' => $project,
            'auth' => [
                'user' => [
                    'id' => $authUser->id,
                    'name' => $authUser->name,
                    'email' => $authUser->email,
                    'profile_photo_url' => $authUser->profile_photo_url ?? null,
                ]
            ]
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->with(['users' => function($query) {
            $query->withPivot('role');
        }])->findOrFail($id);
        
        try {
            $this->authorize('update', $project);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        
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
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->findOrFail($id);
        
        $this->authorize('manageMembers', $project);
        
        $validated = $request->validate([
            'user_id' => [
                'required',
                'exists:users,id',
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
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->findOrFail($id);
        
        $this->authorize('manageMembers', $project);
        
        $validated = request()->validate([
            'user_id' => [
                'required',
                'exists:users,id',
                Rule::exists('project_user', 'user_id')->where('project_id', $id)
            ]
        ]);
        
        $project->users()->detach($validated['user_id']);
        
        return redirect()->route('project-users.index')
            ->with('success', 'Le membre a été retiré du projet avec succès.');
    }

    /**
     * Toggle mute status for a project member
     */
    public function toggleMute(Request $request, $projectId, $userId)
    {
        try {
            $project = Project::findOrFail($projectId);
            $this->authorize('manageMembers', $project);

            $user = $project->users()->where('user_id', $userId)->firstOrFail();
            
            $currentStatus = $user->pivot->is_muted ?? false;
            $newStatus = !$currentStatus;
            
            $updated = DB::table('project_user')
                ->where('project_id', $projectId)
                ->where('user_id', $userId)
                ->update([
                    'is_muted' => $newStatus,
                    'updated_at' => now()
                ]);
            
            if ($updated) {
                $updatedPivot = DB::table('project_user')
                    ->where('project_id', $projectId)
                    ->where('user_id', $userId)
                    ->first();
                    
                $actualStatus = $updatedPivot ? (bool)$updatedPivot->is_muted : $newStatus;
                
                return response()->json([
                    'success' => true,
                    'is_muted' => $actualStatus,
                    'message' => $actualStatus 
                        ? 'Le membre a été mis en sourdine avec succès.' 
                        : 'Le membre n\'est plus en sourdine.'
                ]);
            }
            
            return response()->json([
                'success' => false,
                'message' => 'La mise à jour du statut de sourdine a échoué.'
            ], 500);
            
        } catch (\Exception $e) {
            \Log::error('Erreur lors du basculement du mode sourdine: ' . $e->getMessage(), [
                'project_id' => $projectId,
                'user_id' => $userId,
                'exception' => $e
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Une erreur est survenue lors de la mise à jour du statut de sourdine.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
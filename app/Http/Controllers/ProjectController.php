<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\User;
use Inertia\Inertia;
use App\Events\ProjectUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        // Only show projects where the authenticated user is a member
        $query = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        });
        
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('name', 'like', '%'.$request->search.'%')
                  ->orWhere('description', 'like', '%'.$request->search.'%');
            });
        }
        
        $projects = $query->withCount(['tasks', 'users'])
                         ->with(['users' => function($query) {
                             $query->select('users.id', 'name', 'email')
                                   ->withPivot('role');
                         }])
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
        // Check if user is authorized to create projects
        try {
            $this->authorize('create', Project::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        
        // Get available statuses (default to 'Nouveau' for new projects)
        $availableStatuses = Project::getAvailableStatuses();
        $defaultStatus = Project::STATUS_NOUVEAU;
        
        return Inertia::render('Projects/Create', [
            'availableStatuses' => $availableStatuses,
            'defaultStatus' => $defaultStatus,
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        // Check if user is authorized to create projects
        try {
            $this->authorize('create', Project::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'status' => [
                'nullable', 
                'string', 
                Rule::in(array_keys(Project::getAvailableStatuses()))
            ],
        ]);
        
        // Set default status if not provided
        if (!isset($validated['status'])) {
            $validated['status'] = Project::STATUS_NOUVEAU;
        }
        
        // Create the project
        $project = Project::create($validated);
        
        // Add the creator as a manager of the project
        $project->users()->attach(auth()->id(), [
            'role' => 'manager',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        // Log the creation
        event(new ProjectUpdated($project));
        activity_log('create', 'Création du projet', $project, "Projet '{$project->name}' créé par " . auth()->user()->name);
        
        return redirect()->route('projects.show', $project->id)
            ->with('success', 'Projet créé avec succès !');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        try {
            // Only allow access if the user is a member of the project
            $project = Project::whereHas('users', function($query) {
                $query->where('user_id', auth()->id());
            })->with(['users' => function($query) {
                $query->select('users.id', 'name', 'email', 'profile_photo_path')
                      ->withPivot('role')
                      ->withCasts(['profile_photo_url' => 'string']);
            }])->findOrFail($id);
            
            // Double check user is actually a member
            if (!$project->users->contains(auth()->id())) {
                return Inertia::render('Error403')
                    ->toResponse(request())
                    ->setStatusCode(403);
            }
        
            $currentUser = auth()->user();
            
            // Get tasks with assigned users and sprints
            $tasks = $project->tasks()
                            ->with(['assignedUser', 'sprint'])
                            ->orderBy('created_at', 'desc')
                            ->get();
            
            // Prepare authenticated user data
            $authUser = [
                'id' => $currentUser->id,
                'name' => $currentUser->name,
                'email' => $currentUser->email,
                'profile_photo_url' => $currentUser->profile_photo_url ?? null,
                'role' => $project->users->find($currentUser->id)->pivot->role ?? null,
            ];

            // Prepare project users data with their roles
            $users = $project->users->map(function($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'profile_photo_url' => $user->profile_photo_url ?? null,
                    'role' => $user->pivot->role,
                ];
            });

            // Mettre à jour la collection des utilisateurs avec les URLs de photos
            $project->setRelation('users', $users);

            // Statistiques :
            // 1. Nombre d'activités par utilisateur (liées au projet ou à ses tâches)
            $taskIds = $project->tasks()->pluck('id');
            $activitiesByUser = \App\Models\Activity::where(function($q) use ($project, $taskIds) {
                $q->where(function($q2) use ($project) {
                    $q2->where('subject_type', 'App\\Models\\Project')
                       ->where('subject_id', $project->id);
                })->orWhere(function($q2) use ($taskIds) {
                    $q2->where('subject_type', 'App\\Models\\Task')
                       ->whereIn('subject_id', $taskIds);
                });
            })
            ->selectRaw('user_id, count(*) as count')
            ->groupBy('user_id')
            ->get();
            
            // 2. Nombre de commentaires sur les tâches du projet
            $commentsCount = \App\Models\TaskComment::whereIn('task_id', $taskIds)->count();
            
            // 3. Nombre de fichiers liés au projet
            $filesCount = $project->files()->count();
            
            // 4. Nombre de tâches terminées (et par membre)
            $doneTasks = $project->tasks()->where('status', 'done')->get();
            $doneTasksCount = $doneTasks->count();
            $doneTasksByUser = $doneTasks->groupBy('assigned_to')->map->count();
            
            // 5. Evolution des tâches terminées par semaine (sur 8 semaines)
            $doneTasksByWeek = $project->tasks()
                ->where('status', 'done')
                ->selectRaw('YEARWEEK(updated_at, 1) as yearweek, count(*) as count')
                ->groupBy('yearweek')
                ->orderBy('yearweek')
                ->get();

            return Inertia::render('Projects/Show', [
                'project' => $project,
                'tasks' => $tasks,
                'auth' => [
                    'user' => array_merge($authUser, [
                        'roles' => $currentUser->getRoleNames()->toArray()
                    ])
                ],
                'availableStatuses' => Project::getAvailableStatuses(),
                'stats' => [
                    'activitiesByUser' => $activitiesByUser,
                    'commentsCount' => $commentsCount,
                    'filesCount' => $filesCount,
                    'doneTasksCount' => $doneTasksCount,
                    'doneTasksByUser' => $doneTasksByUser,
                    'doneTasksByWeek' => $doneTasksByWeek,
                ],
            ]);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            // Project not found or user doesn't have access
            return Inertia::render('Error403')
                ->toResponse(request())
                ->setStatusCode(403);
        }
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        // Only allow access if the user is a member of the project
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->with(['users' => function($query) {
            $query->where('user_id', auth()->id())
                  ->select('users.id', 'name', 'email')
                  ->withPivot('role');
        }])->findOrFail($id);
        
        // Check if the user has the required role to edit the project
        $userRole = $project->users->first()->pivot->role ?? null;
        if (!$userRole || !in_array($userRole, ['manager', 'admin'])) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        
        // Get current status and available statuses
        $currentStatus = $project->status;
        $availableStatuses = $project->getAvailableStatuses();
        $nextStatuses = $project->getNextStatuses();
        
        return Inertia::render('Projects/Edit', [
            'project' => $project,
            'currentStatus' => $currentStatus,
            'availableStatuses' => $availableStatuses,
            'nextStatuses' => $nextStatuses,
            'statusTransitions' => $project->getStatusTransitions(),
            'userRole' => $userRole,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        // Only allow update if the user is a member of the project with manager or admin role
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id())
                  ->whereIn('role', ['manager', 'admin']);
        })->findOrFail($id);

        // Validate the request data
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'status' => [
                'required', 
                'string', 
                Rule::in(array_keys(Project::getAvailableStatuses())),
                function ($attribute, $value, $fail) use ($project) {
                    // Check if status has changed
                    if ($project->status !== $value) {
                        // If status changed, validate the transition
                        if (!$project->canChangeStatusTo($value)) {
                            $fail('Transition de statut non autorisée.');
                        }
                    }
                }
            ],
        ]);

        // Check if status has changed
        $statusChanged = $project->status !== $validated['status'];
        $oldStatus = $project->status;
        
        // Update the project
        $project->update($validated);
        
        // If status changed, log the activity and notify team members
        if ($statusChanged) {
            event(new ProjectUpdated($project));
            
            // Log the status change
            activity_log('update', 'Mise à jour du statut du projet', $project, 
                "Statut changé de {$oldStatus} à {$project->status}");
            
            // Notify all project members about the status change
            $project->notifyMembers('project_status_changed', [
                'old_status' => $oldStatus,
                'new_status' => $project->status,
                'changed_by' => auth()->user()->name,
            ]);
        }

        return redirect()->route('projects.show', $project->id)
            ->with('success', 'Projet mis à jour avec succès !');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        // Only allow deletion if the user is a manager or admin of the project
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id())
                  ->whereIn('role', ['manager', 'admin']);
        })->findOrFail($id);
        
        // Get project name before deletion for the log
        $projectName = $project->name;
        
        // Delete the project
        $project->delete();
        
        // Log the deletion
        event(new ProjectUpdated($project));
        activity_log('delete', 'Suppression du projet', $project, "Projet '{$projectName}' supprimé par " . auth()->user()->name);
        
        return redirect()->route('projects.index')
            ->with('success', 'Projet supprimé avec succès !');
    }

    /**
     * API: Get project details as JSON (for dynamic panel)
     * Only accessible to project members
     */
    public function apiShow($id)
    {
        // Only allow access if the user is a member of the project
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->with(['users' => function($query) {
            $query->select('users.id', 'name', 'email', 'profile_photo_path')
                  ->withPivot('role')
                  ->withCasts(['profile_photo_url' => 'string']);
        }])->findOrFail($id);
        
        // Get tasks with assigned users and sprints
        $tasks = $project->tasks()
                        ->with(['assignedUser', 'sprint'])
                        ->orderBy('created_at', 'desc')
                        ->get();
                        
        // Get current user's role in the project
        $userRole = $project->users->find(auth()->id())->pivot->role ?? null;
        
        return response()->json([
            'id' => $project->id,
            'name' => $project->name,
            'description' => $project->description,
            'status' => $project->status,
            'status_label' => $project->status_label,
            'status_color' => $project->status_color,
            'user_role' => $userRole,
            'users' => $project->users,
            'tasks' => $tasks,
        ]);
    }

    /**
        }])->findOrFail($id);
        
        // Get all users who are not already members of the project
        $nonMembers = User::whereDoesntHave('projects', function($query) use ($id) {
            $query->where('project_id', $id);
        })->get(['id', 'name', 'email']);
        
        // Log the access to member management
        activity_log('view', 'Gestion des membres du projet', $project, 
            "Accès à la gestion des membres par " . auth()->user()->name);
            
        return Inertia::render('ProjectUsers/Index', [
            'project' => $project,
            'members' => $project->users,
            'nonMembers' => $nonMembers,
            'availableRoles' => ['member', 'manager', 'observer'],
        ]);
    }

    /**
     * Génère un fichier de suivi global pour le projet
     *
     * @param  int  $id
     * @return \Illuminate\Http\Response
     */
    public function generateSuiviGlobal($id)
    {
        $project = Project::with(['tasks.files' => function($query) {
            $query->where('type', 'text/plain'); // Seulement les fichiers texte
        }])->findOrFail($id);

        // Vérifier que l'utilisateur a accès à ce projet
        if (!$project->users->contains(auth()->id())) {
            abort(403, 'Accès non autorisé à ce projet.');
        }

        $content = "# SUIVI GLOBAL DU PROJET: {$project->name}\n";
        $content .= "Généré le: " . now()->format('d/m/Y H:i') . "\n\n";
        $content .= "## Description du projet\n";
        $content .= $project->description . "\n\n";

        // Récupérer toutes les tâches avec leurs fichiers texte
        $tasks = $project->tasks()->with(['files' => function($query) {
            $query->where('type', 'text/plain');
        }])->orderBy('created_at')->get();

        foreach ($tasks as $task) {
            $content .= "\n## TÂCHE: {$task->title}\n";
            $content .= "Statut: " . ucfirst($task->status) . "\n";
            $content .= "Priorité: " . ucfirst($task->priority) . "\n";
            $content .= "Assigné à: " . ($task->assignedUser ? $task->assignedUser->name : 'Non assigné') . "\n";
            $content .= "Date d'échéance: " . ($task->due_date ? $task->due_date->format('d/m/Y') : 'Non définie') . "\n\n";
            
            if ($task->description) {
                $content .= "### Description de la tâche\n";
                $content .= $task->description . "\n\n";
            }

            // Ajouter le contenu des fichiers texte liés à la tâche
            if ($task->files->isNotEmpty()) {
                $content .= "### Fichiers liés\n";
                foreach ($task->files as $file) {
                    try {
                        $fileContent = Storage::disk('public')->get($file->file_path);
                        $content .= "#### Fichier: {$file->name} (mis à jour le: " . $file->updated_at->format('d/m/Y H:i') . ")\n\n";
                        $content .= $fileContent . "\n\n";
                    } catch (\Exception $e) {
                        $content .= "#### Fichier: {$file->name} (impossible de lire le contenu)\n\n";
                    }
                }
            }
            
            $content .= str_repeat("-", 80) . "\n\n";
        }

        // Créer un nom de fichier unique
        $filename = 'suivi_global_' . Str::slug($project->name) . '_' . now()->format('Ymd_His') . '.txt';
        
        // Retourner le fichier en téléchargement
        return response()->streamDownload(function() use ($content) {
            echo $content;
        }, $filename, [
            'Content-Type' => 'text/plain',
        ]);
    }
}

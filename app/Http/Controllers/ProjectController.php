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
            $query->where('name', 'like', '%'.$request->search.'%')
                  ->orWhere('description', 'like', '%'.$request->search.'%');
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
        return Inertia::render('Projects/Create', [
            'availableStatuses' => Project::getAvailableStatuses(),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'status' => 'nullable|string|in:' . implode(',', array_keys(Project::getAvailableStatuses())),
        ]);
        
        // Si aucun statut n'est fourni, utiliser le statut par défaut
        if (!isset($validated['status'])) {
            $validated['status'] = Project::STATUS_NOUVEAU;
        }
        
        $project = Project::create($validated);
        event(new ProjectUpdated($project));
        activity_log('create', 'Création projet', $project);
        
        return redirect()->route('projects.index')->with('success', 'Projet créé avec succès !');
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $project = Project::with(['users' => function($query) {
            $query->select('users.id', 'name', 'email', 'profile_photo_path')
                  ->withCasts(['profile_photo_url' => 'string']);
        }])->findOrFail($id);
        
        if (!$project->isMember(auth()->user())) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        
        $tasks = $project->tasks()->with(['assignedUser', 'sprint'])->orderBy('created_at', 'desc')->get();
        $currentUser = auth()->user();
        
        // Préparer les informations de l'utilisateur connecté
        $authUser = [
            'id' => $currentUser->id,
            'name' => $currentUser->name,
            'email' => $currentUser->email,
            'profile_photo_url' => $currentUser->profile_photo_url ?? null,
        ];

        // Préparer les utilisateurs avec leur URL de photo de profil
        $users = $project->users->map(function($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'profile_photo_url' => $user->profile_photo_url ?? null,
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
            'availableStatuses' => Project::getAvailableStatuses(),
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
            'description' => 'nullable|string|max:2000',
            'status' => 'nullable|string|in:' . implode(',', array_keys(Project::getAvailableStatuses())),
        ]);
        
        $project->update($validated);
        event(new ProjectUpdated($project));
        activity_log('update', 'Modification projet', $project);
        
        return redirect()->route('projects.index')->with('success', 'Projet modifié avec succès !');
    }

    /**
     * Change project status - Professional status management
     */
    public function changeStatus(Request $request, string $id)
    {
        $project = Project::findOrFail($id);
        
        // Vérifier les permissions
        if (!$project->isMember(auth()->user())) {
            return response()->json(['error' => 'Accès refusé'], 403);
        }
        
        $validated = $request->validate([
            'status' => 'required|string|in:' . implode(',', array_keys(Project::getAvailableStatuses())),
        ]);
        
        $newStatus = $validated['status'];
        
        // Vérifier si la transition de statut est autorisée
        if (!$project->canChangeStatusTo($newStatus)) {
            return response()->json([
                'error' => 'Transition de statut non autorisée',
                'current_status' => $project->status,
                'requested_status' => $newStatus
            ], 422);
        }
        
        $oldStatus = $project->status;
        $project->update(['status' => $newStatus]);
        
        // Log de l'activité
        activity_log('update', "Changement de statut de '{$project->status_label}' vers '{$project->status_label}'", $project);
        
        // Déclencher l'événement
        event(new ProjectUpdated($project));
        
        return response()->json([
            'success' => true,
            'message' => 'Statut du projet modifié avec succès',
            'project' => [
                'id' => $project->id,
                'status' => $project->status,
                'status_label' => $project->status_label,
                'status_color' => $project->status_color,
            ]
        ]);
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
        
        return redirect()->route('projects.index')->with('success', 'Projet supprimé avec succès !');
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
            'description' => $project->description,
            'status' => $project->status,
            'status_label' => $project->status_label,
            'status_color' => $project->status_color,
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

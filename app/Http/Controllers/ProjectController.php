<?php

namespace App\Http\Controllers;

use App\Models\Project;
use App\Models\Sprint;
use App\Models\Task;
use App\Models\User;
use App\Events\ProjectUpdated;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource with filters, sorting and pagination.
     */
    public function index(Request $request)
    {
        try {
            // Only projects where the authenticated user is a member
            $query = Project::query()->whereHas('users', function ($query) {
                $query->where('user_id', Auth::id());
            });

            // --- Global statistics (unfiltered) ---
            $globalStats = [
                'total'       => Project::whereHas('users', fn($q) => $q->where('user_id', Auth::id()))->count(),
                'active'      => Project::whereHas('users', fn($q) => $q->where('user_id', Auth::id()))
                                        ->whereNotIn('status', ['termine', 'suspendu'])->count(),
                'completed'   => Project::whereHas('users', fn($q) => $q->where('user_id', Auth::id()))
                                        ->where('status', 'termine')->count(),
                'totalTasks'  => Task::whereHas('project.users', fn($q) => $q->where('user_id', Auth::id()))->count(),
            ];

            // Filters received from frontend
            $filters = $request->only(['search', 'status', 'sort_by', 'sort_dir']);
            $search  = $filters['search'] ?? null;
            $status  = $filters['status'] ?? null;
            $sortBy  = $filters['sort_by'] ?? 'created_at';
            $sortDir = $filters['sort_dir'] ?? 'desc';

            // Text search
            if (!empty($search)) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', '%' . $search . '%')
                      ->orWhere('description', 'like', '%' . $search . '%');
                });
            }

            // Status filter
            if (!empty($status)) {
                $query->where('status', $status);
            }

            // Allowed sort columns
            $allowedSorts = ['name', 'created_at', 'users_count', 'tasks_count', 'status'];
            if (in_array($sortBy, $allowedSorts)) {
                if ($sortBy === 'users_count') {
                    $query->withCount('users')->orderBy('users_count', $sortDir);
                } elseif ($sortBy === 'tasks_count') {
                    $query->withCount('tasks')->orderBy('tasks_count', $sortDir);
                } else {
                    $query->orderBy($sortBy, $sortDir);
                }
            } else {
                $query->orderBy('created_at', 'desc');
            }

            // Pagination
            $perPage = $request->input('per_page', 12);
            $projects = $query->withCount(['users', 'tasks'])
                              ->with(['users' => function ($q) {
                                  $q->select('users.id', 'users.name', 'users.email')
                                    ->withPivot('role', 'is_muted');
                              }])
                              ->paginate($perPage)
                              ->withQueryString()
                              ->through(function ($project) {
                                  $currentUser = $project->users->find(Auth::id());
                                  $projectData = [
                                      'id'           => $project->id,
                                      'name'         => $project->name,
                                      'description'  => $project->description,
                                      'status'       => $project->status,
                                      'created_at'   => $project->created_at,
                                      'updated_at'   => $project->updated_at,
                                      'users_count'  => $project->users_count,
                                      'tasks_count'  => $project->tasks_count,
                                      'users'        => $project->users->map(fn($user) => [
                                          'id'    => $user->id,
                                          'name'  => $user->name,
                                          'email' => $user->email,
                                          'role'  => $user->pivot->role,
                                      ]),
                                  ];

                                  if ($currentUser && $currentUser->pivot->is_muted) {
                                      $projectData['is_muted'] = true;
                                  }

                                  return $projectData;
                              });

            return Inertia::render('Projects/Index', [
                'projects'    => $projects,
                'filters'     => $filters,
                'globalStats' => $globalStats,
            ]);
        } catch (\Exception $e) {
            \Log::error('ProjectController@index: ' . $e->getMessage());

            $emptyPaginator = new \Illuminate\Pagination\LengthAwarePaginator(
                [], 0, 10, 1, ['path' => request()->url(), 'query' => request()->query()]
            );

            return Inertia::render('Projects/Index', [
                'projects'    => $emptyPaginator,
                'filters'     => $request->only(['search', 'status', 'sort_by', 'sort_dir']),
                'globalStats' => ['total' => 0, 'active' => 0, 'completed' => 0, 'totalTasks' => 0],
                'error'       => 'Une erreur est survenue lors du chargement des projets.',
            ]);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        try {
            $this->authorize('create', Project::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }

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
        try {
            $this->authorize('create', Project::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'meeting_link' => 'nullable|url|max:1000',
            'status' => [
                'nullable',
                'string',
                Rule::in(array_keys(Project::getAvailableStatuses()))
            ],
        ]);

        if (!isset($validated['status'])) {
            $validated['status'] = Project::STATUS_NOUVEAU;
        }

        $project = Project::create($validated);

        $project->users()->attach(auth()->id(), [
            'role' => 'manager',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

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
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->with(['users' => function($query) {
            $query->select('users.id', 'name', 'email', 'profile_photo_path')
                  ->withPivot('role')
                  ->withCasts(['profile_photo_url' => 'string']);
        }])->findOrFail($id);

        $userMembership = $project->users()->where('user_id', auth()->id())->first();
        if (!$userMembership) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        if ($userMembership->pivot->is_muted) {
            return Inertia::render('Error403', [
                'message' => 'You have been muted in this project and cannot access it.'
            ])->toResponse(request())->setStatusCode(403);
        }

        $currentUser = auth()->user();

        // Statistiques des tâches (à la source)
        $taskStats = [
            'total'       => $project->tasks()->count(),
            'todo'        => $project->tasks()->where('status', 'todo')->count(),
            'in_progress' => $project->tasks()->where('status', 'in_progress')->count(),
            'done'        => $project->tasks()->where('status', 'done')->count(),
        ];

        // Sprints
        $sprints = $project->sprints()->orderBy('created_at', 'desc')->paginate(10);

        // Tâches paginées
        $tasks = $project->tasks()
                        ->with(['assignedUser', 'sprint'])
                        ->orderBy('created_at', 'desc')
                        ->paginate(10);

        // Base des stats pour les cartes
        $baseStats = [
            'totalTasks'           => $taskStats['total'],
            'todoTasksCount'       => $taskStats['todo'],
            'inProgressTasksCount' => $taskStats['in_progress'],
            'doneTasksCount'       => $taskStats['done'],
        ];

        // Utilisateur courant formaté
        $authUser = [
            'id'    => $currentUser->id,
            'name'  => $currentUser->name,
            'email' => $currentUser->email,
            'profile_photo_url' => $currentUser->profile_photo_url ?? null,
            'role'  => $project->users->find($currentUser->id)->pivot->role ?? null,
        ];

        // Transformation des utilisateurs du projet
        $users = $project->users->map(function($user) {
            return [
                'id'    => $user->id,
                'name'  => $user->name,
                'email' => $user->email,
                'profile_photo_url' => $user->profile_photo_url ?? null,
                'role'  => $user->pivot->role,
            ];
        });
        $project->setRelation('users', $users);

        // Autres métriques (activités, commentaires, fichiers, etc.)
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

        $commentsCount = \App\Models\TaskComment::whereIn('task_id', $taskIds)->count();
        $filesCount = $project->files()->count();
        $doneTasks = $project->tasks()->where('status', 'done')->get();
        $doneTasksCount = $doneTasks->count();
        $doneTasksByUser = $doneTasks->groupBy('assigned_to')->map->count();
        $doneTasksByWeek = $project->tasks()
            ->where('status', 'done')
            ->selectRaw('YEARWEEK(updated_at, 1) as yearweek, count(*) as count')
            ->groupBy('yearweek')
            ->orderBy('yearweek')
            ->get();

        // Fusion finale – toutes les stats en un seul tableau
        $finalStats = array_merge($baseStats, [
            'activitiesByUser' => $activitiesByUser,
            'commentsCount'    => $commentsCount,
            'filesCount'       => $filesCount,
            'doneTasksCount'   => $doneTasksCount,
            'doneTasksByUser'  => $doneTasksByUser,
            'doneTasksByWeek'  => $doneTasksByWeek,
        ]);

        return Inertia::render('Projects/Show', [
            'project'  => $project,
            'tasks'    => $tasks,
            'sprints'  => $sprints,
            'auth'     => [
                'user' => array_merge($authUser, [
                    'roles' => $currentUser->getRoleNames()->toArray()
                ])
            ],
            'availableStatuses' => Project::getAvailableStatuses(),
            'stats'             => $finalStats, // ✅ contient todoTasksCount, inProgressTasksCount, etc.
        ]);
    } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
        return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
    }
}

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->with(['users' => function($query) {
            $query->where('user_id', auth()->id())
                  ->select('users.id', 'name', 'email')
                  ->withPivot('role');
        }])->findOrFail($id);

        $userRole = $project->users->first()->pivot->role ?? null;
        if (!in_array($userRole, ['manager', 'admin'])) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }

        $availableStatuses = Project::getAvailableStatuses();
        $currentStatus = $project->status;

        $allowedTransitions = [
            'nouveau' => ['demarrage', 'suspendu'],
            'demarrage' => ['en_cours', 'suspendu'],
            'en_cours' => ['avance', 'suspendu'],
            'avance' => ['termine', 'suspendu'],
            'termine' => ['en_cours'],
            'suspendu' => ['demarrage', 'en_cours', 'avance'],
        ];

        $nextStatuses = $allowedTransitions[$currentStatus] ?? [];

        return Inertia::render('Projects/Edit', [
            'project' => $project,
            'availableStatuses' => $availableStatuses,
            'currentStatus' => $currentStatus,
            'nextStatuses' => $nextStatuses,
            'userRole' => $userRole,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        $project = Project::whereHas('users', function($query) {
            $query->where('users.id', auth()->id())
                  ->whereIn('project_user.role', ['manager', 'admin']);
        })->findOrFail($id);

        $availableStatuses = Project::getAvailableStatuses();

        $allowedTransitions = [
            'nouveau' => ['demarrage', 'suspendu'],
            'demarrage' => ['en_cours', 'suspendu'],
            'en_cours' => ['avance', 'suspendu', 'termine'],
            'avance' => ['termine', 'suspendu'],
            'termine' => ['en_cours', 'suspendu'],
            'suspendu' => ['demarrage', 'en_cours', 'avance', 'termine'],
        ];

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:2000',
            'meeting_link' => 'nullable|url|max:1000',
            'status' => [
                'required',
                'string',
                Rule::in(array_keys($availableStatuses)),
                function ($attribute, $value, $fail) use ($project, $allowedTransitions) {
                    if ($project->status !== $value && !in_array($value, $allowedTransitions[$project->status] ?? [])) {
                        $fail("La transition de statut de '{$project->status}' vers '$value' n'est pas autorisée.");
                    }
                },
            ],
        ]);

        $oldStatus = $project->status;
        $project->update($validated);

        activity_log('update', 'Mise à jour du projet', $project,
            "Projet '{$project->name}' mis à jour par " . auth()->user()->name);

        if ($oldStatus !== $project->status) {
            activity_log('update', 'Changement de statut du projet', $project,
                "Statut changé de '{$oldStatus}' à '{$project->status}' par " . auth()->user()->name);

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
     *
     * Suppression directe : réservée à un administrateur système (rôle Spatie 'admin').
     * Un manager de projet ne peut PAS supprimer directement ; il doit passer par
     * destroyWithConsent() qui exige le mot de passe de chaque membre du projet.
     */
    public function destroy(string $id)
    {
        $project = Project::whereHas('users', function($query) {
            $query->where('users.id', auth()->id());
        })->findOrFail($id);

        $currentUser = auth()->user();

        if (!$currentUser->hasRole('admin')) {
            abort(403, "Seul un administrateur système peut supprimer un projet directement. "
                . "En tant que manager, utilisez la procédure de consentement des membres.");
        }

        $projectName = $project->name;
        $project->delete();

        event(new ProjectUpdated($project));
        activity_log('delete', 'Suppression du projet', $project,
            "Projet '{$projectName}' supprimé directement par l'administrateur système " . $currentUser->name);

        return redirect()->route('projects.index')
            ->with('success', 'Projet supprimé avec succès !');
    }

    /**
     * Suppression d'un projet par un manager, soumise au consentement unanime des membres.
     *
     * Chaque membre du projet doit fournir son propre mot de passe de compte pour valider
     * son accord. Le tableau `passwords` est indexé par user_id => mot de passe en clair
     * (jamais loggé, jamais stocké : uniquement vérifié via Hash::check() puis jeté).
     * La suppression n'a lieu que si TOUS les membres ont consenti avec un mot de passe valide.
     */
    public function destroyWithConsent(Request $request, string $id)
    {
        $project = Project::with('users')->whereHas('users', function($query) {
            $query->where('users.id', auth()->id())
                  ->whereIn('project_user.role', ['manager', 'admin']);
        })->findOrFail($id);

        $currentUser = auth()->user();

        // Un administrateur système passe par la suppression directe : on exécute la même
        // logique ici plutôt que de rediriger (une redirection transformerait le DELETE en GET
        // et casserait la suppression).
        if ($currentUser->hasRole('admin')) {
            return $this->destroy($id);
        }

        $validated = $request->validate([
            'passwords' => 'required|array',
            'passwords.*' => 'nullable|string',
        ]);

        $providedPasswords = $validated['passwords'];
        $errors = [];

        foreach ($project->users as $member) {
            $password = $providedPasswords[$member->id] ?? null;

            if (empty($password)) {
                $errors[(string) $member->id] = "{$member->name} n'a pas encore donné son consentement.";
                continue;
            }

            if (!Hash::check($password, $member->password)) {
                $errors[(string) $member->id] = "Mot de passe incorrect pour {$member->name}.";
            }
        }

        if (!empty($errors)) {
            // Toutes les erreurs (message général + une par membre en échec) partent dans
            // le même sac d'erreurs Inertia ; le front les lit directement via `errors`.
            $errors['consent'] = 'Consentement incomplet ou invalide : vérifiez les mots de passe ci-dessous.';

            return back()->withErrors($errors);
        }

        $projectName = $project->name;
        $project->delete();

        event(new ProjectUpdated($project));
        activity_log('delete', 'Suppression du projet (consentement unanime)', $project,
            "Projet '{$projectName}' supprimé après consentement de tous les membres, initié par le manager " . $currentUser->name);

        return redirect()->route('projects.index')
            ->with('success', 'Projet supprimé avec succès après consentement de tous les membres.');
    }

    /**
     * API: Get project details as JSON (for dynamic panel)
     */
    public function apiShow($id)
    {
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->with(['users' => function($query) {
            $query->select('users.id', 'name', 'email', 'profile_photo_path')
                  ->withPivot('role')
                  ->withCasts(['profile_photo_url' => 'string']);
        }])->findOrFail($id);

        $tasks = $project->tasks()
                        ->with(['assignedUser', 'sprint'])
                        ->orderBy('created_at', 'desc')
                        ->get();

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
     * Manage project members.
     */
    public function members($id)
    {
        $project = Project::whereHas('users', function($query) {
            $query->where('users.id', auth()->id());
        })->findOrFail($id);

        $currentUser = $project->users->find(auth()->id());
        if (!in_array($currentUser->pivot->role ?? '', ['manager', 'admin'])) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }

        $nonMembers = User::whereDoesntHave('projects', function($query) use ($id) {
            $query->where('project_id', $id);
        })->get(['id', 'name', 'email']);

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
     * Generate a global tracking file for the project.
     */
    public function generateSuiviGlobal($id, $format = 'txt')
    {
        $project = Project::with(['tasks' => function($query) {
            $query->with(['assignedUser', 'files'])->orderBy('created_at');
        }])->findOrFail($id);

        if (!$project->users->contains(auth()->id())) {
            abort(403, 'Accès non autorisé à ce projet.');
        }

        $data = [
            'project' => $project,
            'tasks' => $project->tasks,
            'generated_at' => now()->format('d/m/Y H:i'),
        ];

        switch (strtolower($format)) {
            case 'pdf':
                return $this->generatePdf($data);
            case 'docx':
                return $this->generateWord($data);
            case 'txt':
            default:
                return $this->generateText($data);
        }
    }

    public function generatePlanning($id, $format = 'pdf')
    {
        $project = Project::with(['users' => function ($query) {
            $query->select('users.id', 'users.name', 'users.email')->withPivot('role');
        }])->findOrFail($id);

        if (!$project->users->contains(auth()->id())) {
            abort(403, 'Accès non autorisé à ce projet.');
        }

        $sprints = Sprint::where('project_id', $project->id)
            ->select(['id', 'name', 'description', 'start_date', 'end_date', 'project_id'])
            ->orderBy('start_date')
            ->orderBy('end_date')
            ->orderBy('name')
            ->get();

        $tasks = Task::where('project_id', $project->id)
            ->select(['id', 'title', 'description', 'due_date', 'status', 'priority', 'assigned_to', 'project_id', 'sprint_id', 'created_at'])
            ->with(['assignedUser' => function ($query) {
                $query->select('id', 'name', 'email');
            }])
            ->orderByRaw('CASE WHEN due_date IS NULL THEN 1 ELSE 0 END')
            ->orderBy('due_date')
            ->orderBy('priority')
            ->orderBy('title')
            ->get();

        $taskGroups = $tasks->groupBy('sprint_id');
        $taskStats = [
            'total' => $tasks->count(),
            'completed' => $tasks->where('status', 'done')->count(),
            'pending' => $tasks->where('status', '!=', 'done')->count(),
            'late' => $tasks->filter(function ($task) {
                return $task->due_date && $task->due_date->isPast() && $task->status !== 'done';
            })->count(),
        ];

        $data = [
            'project' => $project,
            'sprints' => $sprints,
            'tasks' => $tasks,
            'taskGroups' => $taskGroups,
            'taskStats' => $taskStats,
            'members' => $project->users,
            'memberNames' => $project->users->pluck('name')->filter()->implode(', '),
            'generated_at' => now()->format('d/m/Y H:i'),
        ];

        if (strtolower($format) === 'pdf') {
            return $this->generatePlanningPdf($data);
        }

        abort(404, 'Format de planning non pris en charge.');
    }

    protected function generatePlanningPdf($data)
    {
        $options = new \Dompdf\Options();
        $options->set([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'isPhpEnabled' => true,
            'isFontSubsettingEnabled' => true,
            'defaultPaperSize' => 'a4',
            'defaultFont' => 'dejavu sans',
            'fontHeightRatio' => 1.1,
            'dpi' => 140,
            'enableCssFloat' => true,
        ]);

        $dompdf = new \Dompdf\Dompdf($options);
        $html = view('exports.project-planning-pdf', $data)->render();
        $html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $canvas = $dompdf->getCanvas();
        $font = $dompdf->getFontMetrics()->getFont('helvetica');
        $canvas->page_text(525, 800, 'Page {PAGE_NUM} sur {PAGE_COUNT}', $font, 8, [0.5, 0.5, 0.5]);

        $filename = 'planning_' . Str::slug($data['project']->name) . '_' . now()->format('Ymd_His') . '.pdf';
        return $dompdf->stream($filename, ['Attachment' => true, 'compress' => true]);
    }

    protected function generateText($data)
    {
        $content = "# SUIVI GLOBAL DU PROJET: {$data['project']->name}\n";
        $content .= "Généré le: " . $data['generated_at'] . "\n\n";
        $content .= "## Description du projet\n";
        $content .= strip_tags($data['project']->description) . "\n\n";

        foreach ($data['tasks'] as $task) {
            $content .= "\n## TÂCHE: {$task->title}\n";
            $content .= "Statut: " . ucfirst($task->status) . "\n";
            $content .= "Priorité: " . ucfirst($task->priority) . "\n";
            $content .= "Assigné à: " . ($task->assignedUser ? $task->assignedUser->name : 'Non assigné') . "\n";
            $content .= "Date d'échéance: " . ($task->due_date ? $task->due_date->format('d/m/Y') : 'Non définie') . "\n\n";

            if ($task->description) {
                $content .= "### Description de la tâche\n";
                $content .= strip_tags(preg_replace('/<\/?[a-z][^>]*>/', ' ', $task->description)) . "\n\n";
            }

            if ($task->files->isNotEmpty()) {
                $content .= "### Fichiers liés\n";
                foreach ($task->files as $file) {
                    $content .= "- {$file->name} (Type: {$file->type}, Taille: " . $this->formatFileSize($file->size) . ", " .
                                "Mis à jour le: " . $file->updated_at->format('d/m/Y H:i') . ")\n";

                    if (str_starts_with($file->type, 'text/')) {
                        try {
                            $fileContent = Storage::disk('public')->get($file->file_path);
                            if ($fileContent !== false) {
                                $content .= "  ```\n" .
                                preg_replace(['/^[\r\n]+|[\r\n]+$/', '/[\r\n]+/'], ["", "\n  "],
                                strip_tags(preg_replace('/<\/?[a-z][^>]*>/', ' ', $fileContent))) .
                                "\n  ```\n\n";
                            }
                        } catch (\Exception $e) {
                            $content .= "  (Impossible d'afficher le contenu du fichier)\n\n";
                        }
                    } else {
                        $content .= "  [Lien vers le fichier] " . route('files.download', $file->id) . "\n\n";
                    }
                }
            }
            $content .= str_repeat("-", 80) . "\n\n";
        }

        $filename = 'suivi_global_' . Str::slug($data['project']->name) . '_' . now()->format('Ymd_His') . '.txt';

        return response()->streamDownload(function() use ($content) {
            echo $content;
        }, $filename, ['Content-Type' => 'text/plain; charset=utf-8']);
    }

    protected function generatePdf($data)
    {
        $options = new \Dompdf\Options();
        $options->set([
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'isPhpEnabled' => true,
            'isFontSubsettingEnabled' => true,
            'defaultPaperSize' => 'a4',
            'defaultFont' => 'dejavu sans',
            'fontHeightRatio' => 1.1,
            'dpi' => 150,
            'enableCssFloat' => true,
            'isJavascriptEnabled' => true,
        ]);

        $dompdf = new \Dompdf\Dompdf($options);
        $html = view('exports.project-pdf', $data)->render();
        $html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
        $dompdf->loadHtml($html, 'UTF-8');
        $dompdf->setPaper('A4', 'portrait');
        $dompdf->render();

        $canvas = $dompdf->getCanvas();
        $font = $dompdf->getFontMetrics()->getFont('helvetica');
        $canvas->page_text(540, 800, "Page {PAGE_NUM} sur {PAGE_COUNT}", $font, 8, [0.5, 0.5, 0.5]);

        $filename = 'suivi_global_' . Str::slug($data['project']->name) . '_' . now()->format('Ymd_His') . '.pdf';
        return $dompdf->stream($filename, ['Attachment' => true, 'compress' => true]);
    }

    protected function generateWord($data)
    {
        $phpWord = new \PhpOffice\PhpWord\PhpWord();
        $phpWord->setDefaultFontName('Arial');
        $phpWord->setDefaultFontSize(11);
        $section = $phpWord->addSection([
            'marginLeft' => 1000,
            'marginRight' => 1000,
            'marginTop' => 1000,
            'marginBottom' => 1000
        ]);

        $phpWord->addTitleStyle(1, ['size' => 16, 'bold' => true, 'color' => '1F497D']);
        $phpWord->addTitleStyle(2, ['size' => 14, 'bold' => true, 'color' => '4F81BD']);
        $phpWord->addTitleStyle(3, ['size' => 12, 'bold' => true, 'color' => '4F81BD']);
        $phpWord->addFontStyle('normal', ['name' => 'Arial', 'size' => 11, 'color' => '000000']);
        $phpWord->addFontStyle('small', ['name' => 'Arial', 'size' => 9, 'color' => '666666']);
        $phpWord->addFontStyle('bold', ['name' => 'Arial', 'size' => 11, 'bold' => true, 'color' => '000000']);

        $cleanText = function($text) {
            if (is_null($text) || !is_string($text)) return '';
            $text = strip_tags($text);
            $text = str_replace(["\r\n", "\r", "\n"], "\n", $text);
            return iconv('UTF-8', 'UTF-8//IGNORE', $text);
        };

        $section->addTitle('SUIVI GLOBAL DU PROJET: ' . $cleanText($data['project']->name), 1);
        $section->addText('Généré le: ' . $data['generated_at'], 'normal');
        $section->addTextBreak(2);

        $section->addTitle('Description du projet', 2);
        $section->addText($cleanText($data['project']->description), 'normal');
        $section->addTextBreak(2);

        foreach ($data['tasks'] as $task) {
            $section->addTitle('TÂCHE: ' . $cleanText($task->title), 2);
            $section->addText('Statut: ' . ucfirst($task->status), 'normal');
            $section->addText('Priorité: ' . ucfirst($task->priority), 'normal');
            $section->addText('Assigné à: ' . ($task->assignedUser ? $cleanText($task->assignedUser->name) : 'Non assigné'), 'normal');
            $section->addText('Date d\'échéance: ' . ($task->due_date ? $task->due_date->format('d/m/Y') : 'Non définie'), 'normal');
            $section->addTextBreak(1);

            if ($task->description) {
                $section->addTitle('Description de la tâche', 3);
                $section->addText($cleanText($task->description), 'normal');
                $section->addTextBreak(1);
            }

            if ($task->files->isNotEmpty()) {
                $section->addTitle('Fichiers liés', 3);
                foreach ($task->files as $file) {
                    $fileInfo = '• ' . $cleanText($file->name);
                    $fileInfo .= ' (' . $file->type . ', ';
                    $fileInfo .= $file->size > 0 ? $this->formatFileSize($file->size) : 'taille inconnue';
                    $fileInfo .= ', mis à jour le ' . $file->updated_at->format('d/m/Y H:i') . ')';
                    $fileInfo .= ' (Fichier joint - non affiché dans cette version)';
                    $section->addText($fileInfo, 'normal');
                    $section->addTextBreak(1);
                }
                $section->addTextBreak(1);
            }

            $section->addText(str_repeat('-', 80), 'small');
            $section->addTextBreak(2);
        }

        $filename = 'suivi_global_' . Str::slug($data['project']->name) . '_' . now()->format('Ymd_His') . '.docx';
        $filename = preg_replace('/[^a-z0-9\-\._]/i', '_', $filename);

        $tempDir = sys_get_temp_dir();
        $tempFile = tempnam($tempDir, 'word_') . '.docx';

        try {
            $objWriter = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007');
            $objWriter->save($tempFile);

            if (!file_exists($tempFile)) {
                throw new \Exception("Échec de la création du fichier Word");
            }

            return response()->download($tempFile, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0',
                'Pragma' => 'no-cache',
                'Expires' => '0'
            ])->deleteFileAfterSend(true);
        } catch (\Exception $e) {
            if (file_exists($tempFile)) @unlink($tempFile);
            \Log::error('Erreur lors de la génération du fichier Word: ' . $e->getMessage());
            return response()->json([
                'error' => 'Une erreur est survenue lors de la génération du document Word.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    protected function formatFileSize($bytes, $precision = 2)
    {
        $units = ['o', 'Ko', 'Mo', 'Go', 'To', 'Po', 'Eo', 'Zo', 'Yo'];
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        return round($bytes, $precision) . ' ' . $units[$i];
    }
}
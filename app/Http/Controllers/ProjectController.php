<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Project;
use App\Models\User;
use Inertia\Inertia;
use App\Events\ProjectUpdated;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class ProjectController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index(Request $request)
    {
        try {
            // Only show projects where the authenticated user is a member
            $query = Project::query()->whereHas('users', function($query) {
                $query->where('user_id', auth()->id());
            });
            
            // Search functionality
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'like', '%'.$search.'%')
                      ->orWhere('description', 'like', '%'.$search.'%');
                });
            }
            
            // Pagination with error handling
            $perPage = $request->input('per_page', 10);
            $projects = $query->withCount(['tasks', 'users'])
                             ->with(['users' => function($query) {
                                 $query->select('users.id', 'name', 'email')
                                       ->withPivot('role', 'is_muted');
                             }])
                             ->orderBy('created_at', 'desc')
                             ->paginate($perPage)
                             ->withQueryString()
                             ->through(function ($project) {
                                 $currentUser = $project->users->find(auth()->id());
                                 return [
                                     'id' => $project->id,
                                     'name' => $project->name,
                                     'description' => $project->description,
                                     'status' => $project->status,
                                     'created_at' => $project->created_at,
                                     'updated_at' => $project->updated_at,
                                     'users_count' => $project->users_count,
                                     'tasks_count' => $project->tasks_count,
                                     'is_muted' => $currentUser ? $currentUser->pivot->is_muted : false,
                                     'users' => $project->users->map(function($user) {
                                         return [
                                             'id' => $user->id,
                                             'name' => $user->name,
                                             'email' => $user->email,
                                             'role' => $user->pivot->role
                                         ];
                                     })
                                 ];
                             });
            
            return Inertia::render('Projects/Index', [
                'projects' => $projects,
                'filters' => $request->only('search'),
            ]);
            
        } catch (\Exception $e) {
            \Log::error('Error in ProjectController@index: ' . $e->getMessage());
            
            return Inertia::render('Projects/Index', [
                'projects' => [
                    'data' => [],
                    'links' => [],
                    'from' => 0,
                    'to' => 0,
                    'total' => 0,
                    'current_page' => 1,
                    'last_page' => 1,
                ],
                'filters' => $request->only('search'),
                'error' => 'Une erreur est survenue lors du chargement des projets.'
            ]);
        }
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
            
            // Initialize stats array
            $stats = [];
            
            // Get task statistics
            $taskStats = [
                'total' => $project->tasks()->count(),
                'todo' => $project->tasks()->where('status', 'todo')->count(),
                'in_progress' => $project->tasks()->where('status', 'in_progress')->count(),
                'done' => $project->tasks()->where('status', 'done')->count(),
            ];

            // Get tasks with assigned users and sprints with pagination
            $tasks = $project->tasks()
                            ->with(['assignedUser', 'sprint'])
                            ->orderBy('created_at', 'desc')
                            ->paginate(10);
            
            // Add task stats to the stats array
            $stats = array_merge($stats, [
                'totalTasks' => $taskStats['total'],
                'todoTasksCount' => $taskStats['todo'],
                'inProgressTasksCount' => $taskStats['in_progress'],
                'doneTasksCount' => $taskStats['done'],
            ]);
            
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
        // Only allow edit if the user is a member of the project
        $project = Project::whereHas('users', function($query) {
            $query->where('user_id', auth()->id());
        })->with(['users' => function($query) {
            $query->where('user_id', auth()->id())
                  ->select('users.id', 'name', 'email')
                  ->withPivot('role');
        }])->findOrFail($id);
        
        $userRole = $project->users->first()->pivot->role ?? null;
        if (!in_array($userRole, ['manager', 'admin'])) {
            return Inertia::render('Error403')
                ->toResponse(request())
                ->setStatusCode(403);
        }
        
        $availableStatuses = Project::getAvailableStatuses();
        $currentStatus = $project->status;
        
        // Définir les transitions autorisées
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
        // Only allow update if the user is a manager or admin of the project
        $project = Project::whereHas('users', function($query) {
            $query->where('users.id', auth()->id())
                  ->whereIn('project_user.role', ['manager', 'admin']);
        })->findOrFail($id);

        // Récupérer tous les statuts disponibles
        $availableStatuses = Project::getAvailableStatuses();
        
        // Définir les transitions autorisées avec leur ordre chronologique
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
            'status' => [
                'required',
                'string',
                Rule::in(array_keys($availableStatuses)),
                function ($attribute, $value, $fail) use ($project, $allowedTransitions) {
                    $currentStatus = $project->status;
                    
                    // Si le statut ne change pas, pas besoin de vérifier la transition
                    if ($currentStatus === $value) {
                        return;
                    }
                    
                    // Vérifier si la transition est autorisée
                    if (!isset($allowedTransitions[$currentStatus]) || 
                        !in_array($value, $allowedTransitions[$currentStatus])) {
                        $fail("La transition de statut de '$currentStatus' vers '$value' n'est pas autorisée.");
                    }
                },
            ],
        ]);

        $currentStatus = $project->status;
        $newStatus = $validated['status'];

        $oldStatus = $project->status;
        $project->update($validated);

        // Journalisation et notifications
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
     */
    public function destroy(string $id)
    {
        // Only allow deletion if the user is a manager or admin of the project
        $project = Project::whereHas('users', function($query) {
            $query->where('users.id', auth()->id())
                  ->whereIn('project_user.role', ['manager', 'admin']);
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
     * @param  string  $format Format de sortie (txt, pdf, docx)
     * @return \Illuminate\Http\Response
     */
    public function generateSuiviGlobal($id, $format = 'txt')
    {
        $project = Project::with(['tasks' => function($query) {
            $query->with(['assignedUser', 'files'])->orderBy('created_at');
        }])->findOrFail($id);

        // Vérifier que l'utilisateur a accès à ce projet
        if (!$project->users->contains(auth()->id())) {
            abort(403, 'Accès non autorisé à ce projet.');
        }

        // Préparer les données pour la vue
        $data = [
            'project' => $project,
            'tasks' => $project->tasks,
            'generated_at' => now()->format('d/m/Y H:i'),
        ];

        // Générer le contenu en fonction du format demandé
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
    
    /**
     * Génère un fichier texte formaté
     *
     * @param  array  $data
     * @return \Illuminate\Http\Response
     */
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

            // Ajouter les fichiers liés à la tâche
            if ($task->files->isNotEmpty()) {
                $content .= "### Fichiers liés\n";
                foreach ($task->files as $file) {
                    $content .= "- {$file->name} (Type: {$file->type}, Taille: " . $this->formatFileSize($file->size) . ", " . 
                                "Mis à jour le: " . $file->updated_at->format('d/m/Y H:i') . ")\n";
                    
                    // Si c'est un fichier texte, ajouter son contenu nettoyé
                    if (str_starts_with($file->type, 'text/')) {
                        try {
                            $fileContent = Storage::disk('public')->get($file->file_path);
                            if ($fileContent !== false) {
                                $content .= "  ```\n" . 
                                preg_replace(['/^[\r\n]+|[
]+$/', '/[\r\n]+/'], ["", "\n  "], 
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
        }, $filename, [
            'Content-Type' => 'text/plain; charset=utf-8',
        ]);
    }
    
    /**
     * Génère un fichier PDF formaté
     *
     * @param  array  $data
     * @return \Illuminate\Http\Response
     */
    protected function generatePdf($data)
    {
        // Configuration avancée de DomPDF
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
            'isHtml5Parser' => true,
            'isRemoteEnabled' => true,
        ]);

        // Créer une nouvelle instance DomPDF avec les options
        $dompdf = new \Dompdf\Dompdf($options);
        
        // Charger le contenu HTML
        $html = view('exports.project-pdf', $data)->render();
        
        // Nettoyer et formater le HTML
        $html = mb_convert_encoding($html, 'HTML-ENTITIES', 'UTF-8');
        
        // Charger le HTML dans DomPDF
        $dompdf->loadHtml($html, 'UTF-8');
        
        // Configurer le format de page
        $dompdf->setPaper('A4', 'portrait');
        
        // Rendre le PDF
        $dompdf->render();
        
        // Ajouter le pied de page avec la numérotation
        $canvas = $dompdf->getCanvas();
        $font = $dompdf->getFontMetrics()->getFont('helvetica');
        $canvas->page_text(540, 800, "Page {PAGE_NUM} sur {PAGE_COUNT}", $font, 8, [0.5, 0.5, 0.5]);
        
        // Générer le nom du fichier
        $filename = 'suivi_global_' . Str::slug($data['project']->name) . '_' . now()->format('Ymd_His') . '.pdf';
        
        // Télécharger le PDF
        return $dompdf->stream($filename, [
            'Attachment' => true,
            'compress' => true
        ]);
    }
    
    /**
     * Génère un fichier Word formaté
     *
     * @param  array  $data
     * @return \Illuminate\Http\Response
     */
    /**
     * Formate une taille de fichier en octets dans un format lisible (o, Ko, Mo, Go, etc.)
     *
     * @param  int  $bytes
     * @param  int  $precision
     * @return string
     */
    protected function formatFileSize($bytes, $precision = 2)
    {
        $units = ['o', 'Ko', 'Mo', 'Go', 'To', 'Po', 'Eo', 'Zo', 'Yo'];
        
        for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
            $bytes /= 1024;
        }
        
        return round($bytes, $precision) . ' ' . $units[$i];
    }
    
    /**
     * Génère un fichier Word formaté
     *
     * @param  array  $data
     * @return \Illuminate\Http\Response
     */
    protected function generateWord($data)
    {
        // Créer un nouveau document Word avec l'encodage UTF-8
        $phpWord = new \PhpOffice\PhpWord\PhpWord();
        $phpWord->setDefaultFontName('Arial');
        $phpWord->setDefaultFontSize(11);
        
        // Ajouter une section au document
        $section = $phpWord->addSection([
            'marginLeft' => 1000, // 1 inch = 1000 twips
            'marginRight' => 1000,
            'marginTop' => 1000,
            'marginBottom' => 1000
        ]);
        
        // Définir les styles
        $phpWord->addTitleStyle(1, ['size' => 16, 'bold' => true, 'color' => '1F497D']);
        $phpWord->addTitleStyle(2, ['size' => 14, 'bold' => true, 'color' => '4F81BD']);
        $phpWord->addTitleStyle(3, ['size' => 12, 'bold' => true, 'color' => '4F81BD']);
        
        // Style pour le contenu normal
        $phpWord->addFontStyle('normal', ['name' => 'Arial', 'size' => 11, 'color' => '000000']);
        $phpWord->addFontStyle('small', ['name' => 'Arial', 'size' => 9, 'color' => '666666']);
        $phpWord->addFontStyle('bold', ['name' => 'Arial', 'size' => 11, 'bold' => true, 'color' => '000000']);
        
        // Fonction pour nettoyer le texte
        $cleanText = function($text) {
            if (is_null($text) || !is_string($text)) {
                return '';
            }
            // Supprimer les balises HTML et nettoyer le texte
            $text = strip_tags($text);
            // Remplacer les caractères problématiques
            $text = str_replace(["\r\n", "\r", "\n"], "\n", $text);
            // Nettoyer les caractères non valides
            return iconv('UTF-8', 'UTF-8//IGNORE', $text);
        };
        
        // Ajouter le titre
        $section->addTitle('SUIVI GLOBAL DU PROJET: ' . $cleanText($data['project']->name), 1);
        $section->addText('Généré le: ' . $data['generated_at'], 'normal');
        $section->addTextBreak(2);
        
        // Description du projet
        $section->addTitle('Description du projet', 2);
        $section->addText($cleanText($data['project']->description), 'normal');
        $section->addTextBreak(2);
        
        // Tâches
        foreach ($data['tasks'] as $task) {
            $section->addTitle('TÂCHE: ' . $cleanText($task->title), 2);
            
            // Informations de base de la tâche
            $section->addText('Statut: ' . ucfirst($task->status), 'normal');
            $section->addText('Priorité: ' . ucfirst($task->priority), 'normal');
            $section->addText('Assigné à: ' . ($task->assignedUser ? $cleanText($task->assignedUser->name) : 'Non assigné'), 'normal');
            $section->addText('Date d\'échéance: ' . ($task->due_date ? $task->due_date->format('d/m/Y') : 'Non définie'), 'normal');
            $section->addTextBreak(1);
            
            // Description de la tâche
            if ($task->description) {
                $section->addTitle('Description de la tâche', 3);
                $section->addText($cleanText($task->description), 'normal');
                $section->addTextBreak(1);
            }
            
            // Fichiers joints
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
            
            // Séparateur entre les tâches
            $section->addText(str_repeat('-', 80), 'small');
            $section->addTextBreak(2);
        }
        
        // Générer un nom de fichier sécurisé
        $filename = 'suivi_global_' . Str::slug($data['project']->name) . '_' . now()->format('Ymd_His') . '.docx';
        $filename = preg_replace('/[^a-z0-9\-\._]/i', '_', $filename);
        
        // Créer un fichier temporaire
        $tempDir = sys_get_temp_dir();
        $tempFile = tempnam($tempDir, 'word_') . '.docx';
        
        try {
            // Enregistrer le document
            $objWriter = \PhpOffice\PhpWord\IOFactory::createWriter($phpWord, 'Word2007');
            $objWriter->save($tempFile);
            
            // Vérifier que le fichier a été créé
            if (!file_exists($tempFile)) {
                throw new \Exception("Échec de la création du fichier Word");
            }
            
            // Télécharger le fichier
            return response()->download($tempFile, $filename, [
                'Content-Type' => 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'Content-Disposition' => 'attachment; filename="' . $filename . '"',
                'Cache-Control' => 'no-store, no-cache, must-revalidate, post-check=0, pre-check=0',
                'Pragma' => 'no-cache',
                'Expires' => '0'
            ])->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            // En cas d'erreur, supprimer le fichier temporaire s'il existe
            if (file_exists($tempFile)) {
                @unlink($tempFile);
            }
            
            // Journaliser l'erreur
            \Log::error('Erreur lors de la génération du fichier Word: ' . $e->getMessage());
            
            // Retourner une réponse d'erreur
            return response()->json([
                'error' => 'Une erreur est survenue lors de la génération du document Word.',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}

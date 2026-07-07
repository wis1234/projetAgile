<?php

namespace App\Http\Controllers;

use App\Models\File;
use App\Models\Project;
use App\Models\User;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Notifications\InternalNotification;
use App\Notifications\UserActionMailNotification;
use Illuminate\Support\Facades\Storage;
use ZipArchive;
use Illuminate\Support\Facades\App;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Support\Facades\Hash;

// Charger le helper personnalisé
require_once app_path('Helpers/file_helpers.php');

class FileController extends Controller
{
    use AuthorizesRequests;
    /**
     * Display a listing of the resource.
     */
public function index(Request $request)
{
    $user = auth()->user();

    // ── 1. Base query avec relations nécessaires ─────────────────
    $query = File::with([
        'project:id,name',
        'user:id,name',
        'task:id,title,project_id',
    ]);

    // ── 2. Restriction par rôle (non-admin = projets non muets) ──
    if (! $user->hasRole('admin')) {
        $projectIds = $user->projects()
            ->wherePivot('is_muted', false)
            ->pluck('projects.id');

        $query->where(function ($q) use ($projectIds) {
            $q->whereIn('project_id', $projectIds)
              ->orWhereHas('task', fn ($q2) =>
                  $q2->whereIn('project_id', $projectIds)
              );
        });
    }

    // ── 3. Filtre texte (nom, description, projet) ───────────────
    if ($search = trim($request->input('search', ''))) {
        $query->where(function ($q) use ($search) {
            $q->where('name',        'like', "%{$search}%")
              ->orWhere('description','like', "%{$search}%")
              ->orWhereHas('project', fn ($q2) =>
                  $q2->where('name', 'like', "%{$search}%")
              )
              ->orWhereHas('user', fn ($q2) =>
                  $q2->where('name', 'like', "%{$search}%")
              );
        });
    }

    // ── 4. Filtre par type MIME ───────────────────────────────────
    if ($type = $request->input('type', '')) {
        $mimeMap = [
            'image'  => fn ($q) => $q->where('type', 'like', 'image/%'),
            'pdf'    => fn ($q) => $q->where('type', 'like', '%pdf%'),
            'word'   => fn ($q) => $q->where('type', 'like', '%word%')
                                     ->orWhere('type', 'like', '%msword%')
                                     ->orWhere('type', 'like', '%officedocument.word%'),
            'excel'  => fn ($q) => $q->where('type', 'like', '%excel%')
                                     ->orWhere('type', 'like', '%spreadsheet%'),
            'html'   => fn ($q) => $q->where('type', 'like', '%html%')
                                     ->orWhere('type', 'like', '%javascript%')
                                     ->orWhere('type', 'like', '%json%'),
            'other'  => fn ($q) => $q->where('type', 'not like', 'image/%')
                                     ->where('type', 'not like', '%pdf%')
                                     ->where('type', 'not like', '%word%')
                                     ->where('type', 'not like', '%msword%')
                                     ->where('type', 'not like', '%officedocument.word%')
                                     ->where('type', 'not like', '%excel%')
                                     ->where('type', 'not like', '%spreadsheet%')
                                     ->where('type', 'not like', '%html%'),
        ];

        if (isset($mimeMap[$type])) {
            $query->where(function ($q) use ($mimeMap, $type) {
                ($mimeMap[$type])($q);
            });
        }
    }

    // ── 5. Filtre Dropbox ─────────────────────────────────────────
    if ($request->boolean('dropbox')) {
        $query->whereNotNull('dropbox_path');
    }

    // ── 6. Filtre par projet ──────────────────────────────────────
    if ($projectId = $request->input('project')) {
        $query->where('project_id', $projectId);
    }

    // ── 7. Tri dynamique ──────────────────────────────────────────
    $sortAllowed = ['created_at', 'name', 'size'];
    $sortKey = in_array($request->input('sort'), $sortAllowed)
        ? $request->input('sort')
        : 'created_at';
    $sortDir = $request->input('dir') === 'asc' ? 'asc' : 'desc';

    $query->orderBy($sortKey, $sortDir);

    // ── 8. Pagination (conserve les query strings) ────────────────
    $files = $query->paginate(12)->withQueryString()
        ->through(function ($file) {
            // Résoudre project_is_muted sur chaque fichier
            $project = $file->project ?? ($file->task?->project ?? null);

            $file->project_is_muted = false;

            if ($project) {
                $pivot = $project->users()
                    ->where('user_id', auth()->id())
                    ->first()?->pivot;
                $file->project_is_muted = (bool) ($pivot?->is_muted ?? false);
            }

            return $file;
        });

    // ── 9. Stats globales (sur la scope utilisateur, SANS pagination) ──
    //    On repart de la même logique de restriction mais sans les filtres
    //    de recherche/type pour avoir les totaux "vrais".
    $statsQuery = File::query();

    if (! $user->hasRole('admin')) {
        $projectIds = $user->projects()
            ->wherePivot('is_muted', false)
            ->pluck('projects.id');

        $statsQuery->where(function ($q) use ($projectIds) {
            $q->whereIn('project_id', $projectIds)
              ->orWhereHas('task', fn ($q2) =>
                  $q2->whereIn('project_id', $projectIds)
              );
        });
    }

    $stats = [
        // Nombre total de fichiers accessibles (tous, sans filtre)
        'total_files'   => (clone $statsQuery)->count(),

        // Taille totale en octets (somme réelle DB)
        'total_size'    => (clone $statsQuery)->sum('size'),

        // Fichiers via Dropbox
        'dropbox_count' => (clone $statsQuery)->whereNotNull('dropbox_path')->count(),

        // Images uniquement
        'image_count'   => (clone $statsQuery)->where('type', 'like', 'image/%')->count(),

        // Répartition par type (pour un éventuel pie chart futur)
        'by_type' => [
            'pdf'   => (clone $statsQuery)->where('type', 'like', '%pdf%')->count(),
            'word'  => (clone $statsQuery)->where(fn ($q) =>
                            $q->where('type', 'like', '%word%')
                              ->orWhere('type', 'like', '%officedocument.word%')
                        )->count(),
            'excel' => (clone $statsQuery)->where(fn ($q) =>
                            $q->where('type', 'like', '%excel%')
                              ->orWhere('type', 'like', '%spreadsheet%')
                        )->count(),
            'image' => (clone $statsQuery)->where('type', 'like', 'image/%')->count(),
        ],
    ];

    // ── 10. Projets disponibles pour le filtre dropdown ───────────
    $projects = $user->hasRole('admin')
        ? Project::orderBy('name')->get(['id', 'name'])
        : $user->projects()->orderBy('name')->get(['projects.id', 'projects.name']);

    return Inertia::render('Files/Index', [
        'files'   => $files,
        'stats'   => $stats,
        'projects'=> $projects,
        'filters' => $request->only(['search', 'type', 'dropbox', 'project', 'sort', 'dir']),
    ]);
}


    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        $currentUser = auth()->user();
        $projects = $currentUser->hasRole('admin')
            ? Project::all(['id', 'name'])
            : $currentUser->projects()->get(['projects.id', 'projects.name']);
        $users = User::all(['id', 'name']);
        $tasks = \App\Models\Task::all(['id', 'title']);
        $kanbans = \App\Models\Sprint::all(['id', 'name']);
        return Inertia::render('Files/Create', [
            'projects' => $projects,
            'users' => $users,
            'tasks' => $tasks,
            'kanbans' => $kanbans,
            'auth' => [
                'user' => $currentUser->only('id', 'name')
            ]
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
public function store(Request $request)
    {
        $currentUser = auth()->user();
        $project = Project::findOrFail($request->project_id);
        if (!$currentUser->hasRole('admin') && !$project->users()->where('user_id', $currentUser->id)->exists()) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'file' => 'required|file|max:102400', // 100 Mo max
            'project_id' => 'required|exists:projects,id',
            'task_id' => 'nullable|exists:tasks,id',
            'kanban_id' => 'nullable|exists:sprints,id',
            'description' => 'nullable|string',
        ]);
        try {
            $file = $request->file('file');
            $originalName = $file->getClientOriginalName();
            $extension = $file->getClientOriginalExtension();
            $fileName = $validated['name'] . (str_ends_with(strtolower($validated['name']), '.' . strtolower($extension)) ? '' : '.' . $extension);
            
            // Stocker le fichier
            $path = $file->storeAs('files', $fileName, 'public');
            
            // Créer l'entrée en base de données
            $fileModel = File::create([
                'name' => $validated['name'],
                'file_path' => 'public/' . $path,
                'type' => $file->getClientMimeType(),
                'size' => $file->getSize(),
                'user_id' => $currentUser->id,
                'project_id' => $validated['project_id'],
                'task_id' => $validated['task_id'] ?? null,
                'kanban_id' => $validated['kanban_id'] ?? null,
                'description' => $validated['description'] ?? null,
                'status' => 'pending',
            ]);
            // Journaliser l'action
            activity_log('upload', 'Upload fichier', $fileModel);

            // Notifier les utilisateurs concernés
            $project = Project::with('users')->find($validated['project_id']);
            $task = null;
            
            if ($validated['task_id'] ?? null) {
                $task = \App\Models\Task::with(['assignedUsers', 'project.users'])->find($validated['task_id']);
                
                // Si le fichier est lié à une tâche, utiliser la notification personnalisée
                if ($task) {
                    // Récupérer les utilisateurs à notifier
                    $usersToNotify = collect();
                    
                    // Ajouter les membres du projet
                    if ($task->project && $task->project->users) {
                        $usersToNotify = $usersToNotify->merge($task->project->users);
                    }
                    
                    // Ajouter l'utilisateur assigné à la tâche s'il existe
                    if ($task->assignedUsers) {
                        $assignedUsers = $task->assignedUsers;
                        if ($assignedUsers instanceof \Illuminate\Database\Eloquent\Collection) {
                            if ($assignedUsers->count() > 0) {
                                $usersToNotify = $usersToNotify->merge($assignedUsers);
                            }
                        } else if (is_object($assignedUsers)) {
                            // Si c'est un seul modèle et non une collection
                            $usersToNotify->push($assignedUsers);
                        }
                    }
                    
                    // Ajouter l'auteur de la tâche s'il existe et est différent de l'utilisateur actuel
                    if ($task->creator && $task->creator->id != $currentUser->id) {
                        $usersToNotify->push($task->creator);
                    }
                    
                    // Éviter les doublons et ne pas notifier l'uploader
                    $usersToNotify = $usersToNotify->unique('id')
                        ->filter(function ($user) use ($currentUser) {
                            return $user && $user->id !== $currentUser->id;
                        });
                    
                    // Envoyer la notification à chaque utilisateur concerné
                    foreach ($usersToNotify as $user) {
                        $user->notify(new \App\Notifications\TaskFileUploadNotification(
                            $task, 
                            $fileModel,
                            $currentUser
                        ));
                    }
                }
            }
            
            // Notification standard pour les fichiers sans tâche ou en cas d'erreur
            if ((!$task || $usersToNotify->isEmpty()) && $project) {
                $membersList = $project->users->map(function($u) {
                    $role = $u->pivot->role ?? '-';
                    return $u->name . ' (' . $role . ')';
                })->implode(', ');
                
                foreach ($project->users as $member) {
                    if ($member->id != $currentUser->id) {
                        $message =
                            "Un nouveau fichier a été uploadé dans le projet : {$project->name}\n" .
                            ($task ? "Tâche : {$task->title}\n" : '') .
                            "Fichier : {$fileModel->name} ({$fileModel->size} octets)\n" .
                            "Ajouté par : " . ($fileModel->user->name ?? 'un membre du projet') . "\n" .
                            "Membres du projet : {$membersList}";
                        
                        $member->notify(new \App\Notifications\UserActionMailNotification(
                            'Nouveau fichier ajouté au projet',
                            $message,
                            route('files.show', $fileModel->id),
                            'Voir le fichier',
                            [
                                'file_id' => $fileModel->id,
                                'project_id' => $project->id,
                            ]
                        ));
                    }
                }
            }

            // Répondre en fonction du type de requête
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => true,
                    'message' => 'Fichier importé avec succès',
                    'data' => [
                        'id' => $fileModel->id,
                        'name' => $fileModel->name,
                        'url' => Storage::url($fileModel->file_path),
                        'created_at' => $fileModel->created_at->format('d/m/Y H:i')
                    ]
                ]);
            }

            return redirect()->route('files.index')
                ->with('success', 'Fichier importé avec succès');
                
        } catch (\Exception $e) {
            // Supprimer le fichier s'il a été créé
            if (isset($path) && Storage::disk('public')->exists($path)) {
                Storage::disk('public')->delete($path);
            }
            
            // Journaliser l'erreur
            \Log::error('Erreur lors de l\'upload du fichier : ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            if ($request->wantsJson() || $request->ajax()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Une erreur est survenue lors de l\'upload du fichier : ' . $e->getMessage()
                ], 500);
            }
            
            return back()->withInput()
                ->with('error', 'Une erreur est survenue lors de l\'upload du fichier : ' . $e->getMessage());
        }
    }

    /**
     * Display the specified resource.
     */
    public function show(File $file)
    {
        $this->authorize('view', $file);
        $file->load(['project', 'user', 'task']);
        $statuses = ['pending', 'validated', 'rejected'];
        $user = auth()->user();

        $canUpdateStatus = false;
        $canManageFile = false;

        if ($user) {
            if ($user->hasRole('admin')) {
                $canUpdateStatus = true;
                $canManageFile = true;
            } elseif ($file->project) {
                $projectUser = $file->project->users()->where('user_id', $user->id)->first();
                if ($projectUser && $projectUser->pivot->role === 'manager') {
                    $canUpdateStatus = true;
                    $canManageFile = true;
                }
            }
        }

        return Inertia::render('Files/Show', [
            'file' => $file,
            'canUpdateStatus' => $canUpdateStatus,
            'statuses' => $statuses,
            'canManageFile' => $canManageFile,
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(File $file)
    {
        $currentUser = auth()->user();
        if (!$currentUser->hasRole('admin') && (!$file->project || !$file->project->users()->where('user_id', $currentUser->id)->exists())) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $projects = Project::all(['id', 'name']);
        $users = User::all(['id', 'name']);
        $tasks = \App\Models\Task::all(['id', 'title']);
        $kanbans = \App\Models\Sprint::all(['id', 'name']);
        return Inertia::render('Files/Edit', [
            'file' => $file,
            'projects' => $projects,
            'users' => $users,
            'tasks' => $tasks,
            'kanbans' => $kanbans,
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, File $file)
    {
        $currentUser = auth()->user();
        if (!$currentUser->hasRole('admin') && (!$file->project || !$file->project->users()->where('user_id', $currentUser->id)->exists())) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'project_id' => 'required|exists:projects,id',
            'task_id' => 'required|exists:tasks,id',
            'kanban_id' => 'required|exists:sprints,id',
            'user_id' => 'required|exists:users,id',
            'description' => 'nullable|string',
            'status' => 'required|in:pending,validated,rejected',
            'rejection_reason' => 'nullable|string',
            'file' => 'nullable|file|max:10240', // 10 Mo max
        ]);

        $oldStatus = $file->status;

        $updateData = $request->except('file');

        // Handle file update
        if ($request->hasFile('file')) {
            // Delete old file
            if ($file->file_path && Storage::disk('public')->exists($file->file_path)) {
                Storage::disk('public')->delete($file->file_path);
            }

            // Store new file
            $newFile = $request->file('file');
            $path = $newFile->store('files', 'public');
            $updateData['file_path'] = $path;
            $updateData['type'] = $newFile->getClientMimeType();
            $updateData['size'] = $newFile->getSize();
        }

        $file->update($updateData);

        activity_log('update', 'Modification fichier', $file);
        // Notifier l'utilisateur si le statut change
        if ($validated['status'] !== $oldStatus) {
            $user = $file->user;
            $project = $file->project;
            $message = '';
            $type = 'info';
            if ($validated['status'] === 'validated') {
                $message = "Votre fichier '{$file->name}' a été validé.";
                $type = 'success';
            } elseif ($validated['status'] === 'rejected') {
                $message = "Votre fichier '{$file->name}' a été rejeté. Motif : " . ($validated['rejection_reason'] ?? '');
                $type = 'error';
            }
            if ($user) {
                // Notification interne
                $user->notify(new InternalNotification($message, $type, [
                    'file_id' => $file->id,
                    'project_id' => $project?->id,
                    'status' => $validated['status'],
                ]));
                // Notification email
                $user->notify(new UserActionMailNotification(
                    'Changement de statut de votre fichier',
                    $message,
                    route('files.show', $file->id),
                    'Voir le fichier',
                    [
                        'file_id' => $file->id,
                        'project_id' => $project?->id,
                        'status' => $validated['status'],
                    ]
                ));
            }
        }
        if ($request->header('X-Inertia')) {
            // Si la requête vient d'Inertia, utiliser Inertia::location pour forcer une redirection côté client
            return Inertia::location(route('files.index'));
        }
        
        // Pour les requêtes normales (API, etc.)
        return redirect()->route('files.index')->with('success', 'Fichier mis à jour');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(File $file)
    {
        $this->authorize('delete', $file);
        
        // Supprimer le fichier physique
        Storage::disk('public')->delete($file->file_path);
        
        // Supprimer l'entrée en base de données
        $file->delete();
        
        return redirect()->route('files.index')
            ->with('success', 'Fichier supprimé avec succès');
    }
    
    //old version of download function
    
      //  public function download(File $file)
  //  {
    //    $currentUser = auth()->user();
    //    if (!$currentUser->hasRole('admin') && (!$file->project || !$file->project->users()->where('user_id', $currentUser->id)->exists())) {
     //       abort(403, 'Vous n\'êtes pas autorisé à télécharger ce fichier.');
     //   }
     //   if (!$file->file_path || \Storage::disk('public')->exists($file->file_path) === false) {
          //  abort(404, 'Fichier non trouvé');
     //   }
        // Ensure the download filename has the correct extension
      //  $extension = pathinfo($file->file_path, PATHINFO_EXTENSION);
      //  $filename = $file->name;
      //  if ($extension && !str_ends_with($filename, '.' . $extension)) {
      //      $filename .= '.' . $extension;
       // }
      //  return response()->download(storage_path('app/public/' . $file->file_path), $filename);
   // }
    
    

public function download(File $file)
{
    $currentUser = auth()->user();

    if (
        !$currentUser->hasRole('admin') &&
        (!$file->project || !$file->project->users()->where('user_id', $currentUser->id)->exists())
    ) {
        abort(403, 'Vous n\'êtes pas autorisé à télécharger ce fichier.');
    }

    if (!$file->file_path) {
        abort(404, 'Fichier non trouvé');
    }

    // 🔥 retirer "public/" si présent
    $path = preg_replace('/^public\//', '', $file->file_path);

    if (!\Storage::disk('public')->exists($path)) {
        abort(404, 'Fichier non trouvé');
    }

    $extension = pathinfo($path, PATHINFO_EXTENSION);
    $filename = $file->name;

    if ($extension && !str_ends_with($filename, '.' . $extension)) {
        $filename .= '.' . $extension;
    }

    return \Storage::disk('public')->download($path, $filename);
}

    /**
     * Affiche le formulaire d'édition du contenu d'un fichier
     *
     * @param  \App\Models\File  $file
     * @return \Inertia\Response|\Illuminate\Http\RedirectResponse
     */
public function editContent(File $file)
{
    $this->authorize('view', $file);
     $file->load(['project.users', 'task.project']); // ← ajoute cette ligne

    $this->authorize('update', $file);

    $editableTypes = ['text/plain', 'text/html', 'text/css', 'application/javascript', 'application/json'];
    $extension = pathinfo($file->name, PATHINFO_EXTENSION);
    $isEditable = in_array($file->type, $editableTypes)
        || in_array(strtolower($extension), ['txt', 'md', 'html', 'css', 'js', 'json', 'xml', 'php']);

    if (!$isEditable) {
        return redirect()->back()->with('error', 'Ce type de fichier ne peut pas être édité directement.');
    }

    $filePath = storage_path('app/public/' . preg_replace('/^public\//', '', $file->file_path));
    if (!file_exists($filePath) || !is_readable($filePath)) {
        return redirect()->back()->with('error', 'Impossible de charger le contenu du fichier.');
    }

    $content = file_get_contents($filePath);

    $file->load(['lastModifiedBy:id,name', 'project.users', 'accesses.user:id,name,email,profile_photo_path']);

    $currentUser = auth()->user();
    $myPermission = $file->accessFor($currentUser);

    // Collaborateurs actifs (accès non-expiré, non-none)
    $collaborators = $file->accesses
        ->filter(fn($a) => $a->effectivePermission() !== 'none')
        ->map(fn($a) => [
            'id'                => $a->user->id,
            'name'              => $a->user->name,
            'email'             => $a->user->email,
            'profile_photo_url' => $a->user->profile_photo_path,
            'permission'        => $a->effectivePermission(),
        ])->values();

    // Membres du projet pour suggestions @mention
    $projectMembers = [];
    if ($file->project?->users) {
        $projectMembers = $file->project->users->map(fn($u) => [
            'id'    => $u->id,
            'name'  => $u->name,
            'email' => $u->email,
            'avatar'=> $u->profile_photo_path,
        ]);
    }

    // 5 dernières versions pour l'aperçu rapide
    $recentVersions = $file->versions()
        ->with('user:id,name,profile_photo_path')
        ->select('id','file_id','user_id','label','summary','version_number','created_at')
        ->limit(5)
        ->get();

    return \Inertia\Inertia::render('Files/EditContent', [
        'file' => array_merge($file->toArray(), [
            'content'    => $content,
            'is_editable'=> $isEditable,
            'project'    => $file->project ? [
                'id'    => $file->project->id,
                'name'  => $file->project->name,
                'users' => $projectMembers,
            ] : null,
        ]),
        'lastModifiedBy'  => $file->lastModifiedBy ? [
            'name'      => $file->lastModifiedBy->name,
            'timestamp' => $file->updated_at->toDateTimeString(),
        ] : null,
        'myPermission'    => $myPermission,
        'collaborators'   => $collaborators,
        'recentVersions'  => $recentVersions,
        'canManageAccess' => $file->canUser($currentUser, 'admin'),
    ]);
}




    /**
     * Met à jour le contenu d'un fichier texte
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \App\Models\File  $file
     * @return \Illuminate\Http\JsonResponse
     */


public function updateContent(Request $request, File $file)
{
    $this->authorize('update', $file);
    $request->validate(['content' => 'required|string']);

    if (!is_file_editable($file->type, $file->name)) {
        return response()->json(['success' => false, 'message' => 'Ce type de fichier ne peut pas être modifié.'], 422);
    }

    // ── Écriture sur disque ───────────────────────────────
    $path = 'files/' . $file->project_id . '/' . $file->name;
    \Storage::disk('public')->put($path, $request->content);

    $file->update([
        'file_path'        => $path,
        'size'             => \Storage::disk('public')->size($path),
        'last_modified_by' => \Auth::id(),
        'updated_at'       => now(),
    ]);

    // ── Snapshot automatique ──────────────────────────────
    $lastVersion = $file->versions()->max('version_number') ?? 0;

    \App\Models\FileVersion::create([
        'file_id'        => $file->id,
        'user_id'        => \Auth::id(),
        'content'        => $request->content,
        'label'          => null,
        'summary'        => $request->input('summary'),
        'version_number' => $lastVersion + 1,
    ]);

// ── Garder seulement les 100 dernières versions ───────
$oldVersionIds = $file->versions()
    ->orderByDesc('version_number')
    ->skip(100)
    ->take(PHP_INT_MAX)
    ->pluck('id');

    if ($oldVersionIds->isNotEmpty()) {
        \App\Models\FileVersion::whereIn('id', $oldVersionIds)->delete();
    }

    activity()
        ->causedBy(auth()->user())
        ->performedOn($file)
        ->log('Contenu du fichier mis à jour');

    return response()->json(['success' => true, 'message' => 'Le contenu a été sauvegardé avec succès.']);
}

    /**
     * Télécharger plusieurs fichiers en ZIP
     */
    public function downloadMultiple(Request $request)
    {
        $ids = $request->input('ids', []);
        if (!is_array($ids) || empty($ids)) {
            return abort(400, 'Aucun fichier sélectionné');
        }
        $files = File::whereIn('id', $ids)->get();
        if ($files->isEmpty()) {
            return abort(404, 'Aucun fichier trouvé');
        }
        $zip = new ZipArchive();
        $zipFileName = 'fichiers_' . date('Ymd_His') . '.zip';
        $tmpPath = storage_path('app/tmp/' . $zipFileName);
        if (!file_exists(storage_path('app/tmp'))) {
            mkdir(storage_path('app/tmp'), 0777, true);
        }
        if ($zip->open($tmpPath, ZipArchive::CREATE | ZipArchive::OVERWRITE) !== true) {
            return abort(500, 'Impossible de créer l\'archive ZIP');
        }
        foreach ($files as $file) {
            if ($file->file_path && Storage::disk('public')->exists($file->file_path)) {
                $zip->addFile(storage_path('app/public/' . $file->file_path), $file->name);
            }
        }
        $zip->close();
        if (!file_exists($tmpPath)) {
            return abort(500, 'Erreur lors de la création du ZIP');
        }
        return response()->download($tmpPath, $zipFileName)->deleteFileAfterSend(true);
    }
    
    
    
    // For non-managers: verify the password
public function unlock(Request $request, File $file)
{
    $this->authorize('view', $file); // ✅ use existing policy

    // ✅ Admin bypass directement
    if (auth()->user()->hasRole('admin')) {
        return response()->json(['message' => 'OK (admin bypass)'], 200);
    }
    
    $request->validate(['password' => 'required|string']);

    if (!$file->is_password_protected) {
        return response()->json(['message' => 'Not protected'], 200);
    }

    if (!Hash::check($request->password, $file->password_hash)) {
        return response()->json(['message' => 'Mot de passe incorrect'], 422);
    }

    return response()->json(['message' => 'OK'], 200);
}


// For managers: set or remove a password
public function setPassword(Request $request, File $file)
{
    $this->authorize('update', $file); // ✅ FIX HERE

    if ($request->action === 'remove') {
        $file->update([
            'password_hash' => null,
            'is_password_protected' => false,
        ]);

        return response()->json(['message' => 'Protection supprimée']);
    }

    $request->validate(['password' => 'required|string|min:6']);

    $file->update([
        'password_hash' => Hash::make($request->password),
        'is_password_protected' => true,
    ]);

    return response()->json(['message' => 'Mot de passe enregistré']);
}



public function serveFile(Request $request, $filename)
{
    if (!auth()->check()) {
        return redirect()->route('login');
    }

    // Décoder l'URL (%201 → espace, etc.)
    $decodedFilename = urldecode($filename);

    // Chercher en base avec le nom décodé
    $file = File::where('file_path', 'like', '%' . $decodedFilename . '%')
               ->orWhere('file_path', 'files/' . $decodedFilename)
               ->orWhere('file_path', 'public/files/' . $decodedFilename)
               ->first();

    if (!$file) {
        abort(403); // Fichier non référencé en DB → bloquer
    }

    $this->authorize('view', $file);

    // Chemin physique réel
    $physicalPath = public_path('storage/files/' . $decodedFilename);

    if (!file_exists($physicalPath)) {
        abort(404);
    }

    $mimeType = $file->type
        ?? mime_content_type($physicalPath)
        ?? 'application/octet-stream';

    return response()->file($physicalPath, [
        'Content-Type'        => $mimeType,
        'Content-Disposition' => 'inline; filename="' . $file->name . '"',
    ]);
}

    
}

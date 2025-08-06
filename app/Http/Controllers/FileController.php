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
        $query = File::with(['project', 'user', 'task']);
        $currentUser = auth()->user();
        if (!$currentUser->hasRole('admin')) {
            $projectIds = $currentUser->projects()->pluck('projects.id');
            $query->whereIn('project_id', $projectIds);
        }
        if ($request->search) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%$search%")
                  ->orWhere('description', 'like', "%$search%")
                  ->orWhereHas('project', function($q2) use ($search) {
                      $q2->where('name', 'like', "%$search%");
                  });
            });
        }
        $files = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();
        return Inertia::render('Files/Index', [
            'files' => $files,
            'filters' => $request->only('search'),
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
                'file_path' => $path,
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

            // Notifier tous les membres du projet (sauf l'uploader)
            $project = Project::with('users')->find($validated['project_id']);
            $task = null;
            if ($validated['task_id'] ?? null) {
                $task = \App\Models\Task::find($validated['task_id']);
            }
            
            // Envoyer les notifications de manière asynchrone
            if ($project) {
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

    public function download(File $file)
    {
        $currentUser = auth()->user();
        if (!$currentUser->hasRole('admin') && (!$file->project || !$file->project->users()->where('user_id', $currentUser->id)->exists())) {
            abort(403, 'Vous n\'êtes pas autorisé à télécharger ce fichier.');
        }
        if (!$file->file_path || \Storage::disk('public')->exists($file->file_path) === false) {
            abort(404, 'Fichier non trouvé');
        }
        // Ensure the download filename has the correct extension
        $extension = pathinfo($file->file_path, PATHINFO_EXTENSION);
        $filename = $file->name;
        if ($extension && !str_ends_with($filename, '.' . $extension)) {
            $filename .= '.' . $extension;
        }
        return response()->download(storage_path('app/public/' . $file->file_path), $filename);
    }

    /**
     * Affiche le formulaire d'édition du contenu d'un fichier
     *
     * @param  \App\Models\File  $file
     * @return \Inertia\Response|\Illuminate\Http\RedirectResponse
     */
    public function editContent(File $file)
    {
        $this->authorize('update', $file);
        
        // Vérifier si le fichier est éditable (exemple: fichiers texte, pas de binaires)
        $editableTypes = ['text/plain', 'text/html', 'text/css', 'application/javascript', 'application/json', 'application/xml'];
        $extension = pathinfo($file->name, PATHINFO_EXTENSION);
        $isEditable = in_array($file->type, $editableTypes) || in_array(strtolower($extension), ['txt', 'md', 'html', 'css', 'js', 'json', 'xml', 'php']);
        
        if (!$isEditable) {
            return redirect()->back()->with('error', 'Ce type de fichier ne peut pas être édité directement.');
        }
        
        // Charger le contenu du fichier
        $content = '';
        $filePath = storage_path('app/public/' . $file->file_path);
        
        if (file_exists($filePath) && is_readable($filePath)) {
            $content = file_get_contents($filePath);
        } else {
            return redirect()->back()->with('error', 'Impossible de charger le contenu du fichier.');
        }
        
        $file->load('lastModifiedBy');

        return Inertia::render('Files/EditContent', [
            'file' => array_merge($file->toArray(), [
                'content' => $content,
                'is_editable' => $isEditable
            ]),
            'lastModifiedBy' => $file->lastModifiedBy ? [
                'name' => $file->lastModifiedBy->name,
                'timestamp' => $file->updated_at->toDateTimeString(),
            ] : null,
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

        $request->validate([
            'content' => 'required|string',
        ]);

        try {
            if (!is_file_editable($file->type, $file->name)) {
                return back()->with('error', 'Ce type de fichier ne peut pas être modifié.');
            }

            $path = 'files/' . $file->project_id . '/' . $file->name;
            Storage::disk('public')->put($path, $request->content);

            $file->update([
                'file_path' => $path,
                'size' => Storage::disk('public')->size($path),
                'last_modified_by' => Auth::id(),
                'updated_at' => now(),
            ]);

            activity()
                ->causedBy(auth()->user())
                ->performedOn($file)
                ->log('Contenu du fichier mis à jour');

            return back()->with('success', 'Le contenu a été sauvegardé avec succès.');

        } catch (\Exception $e) {
            Log::error('Erreur lors de la mise à jour du contenu du fichier: ' . $e->getMessage());
            return back()->with('error', 'Une erreur est survenue lors de la sauvegarde.');
        }
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
}

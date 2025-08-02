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
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

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
            'file' => 'required|file|max:10240', // 10 Mo max
            'project_id' => 'required|exists:projects,id',
            'task_id' => 'required|exists:tasks,id',
            'kanban_id' => 'required|exists:sprints,id',
            'description' => 'nullable|string',
        ]);
        $file = $request->file('file');
        $path = $file->store('files', 'public');
        $fileModel = File::create([
            'name' => $validated['name'],
            'file_path' => $path,
            'type' => $file->getClientMimeType(),
            'size' => $file->getSize(),
            'user_id' => $currentUser->id,
            'project_id' => $validated['project_id'],
            'task_id' => $validated['task_id'],
            'kanban_id' => $validated['kanban_id'],
            'description' => $validated['description'] ?? null,
            'status' => 'pending',
        ]);
        activity_log('upload', 'Upload fichier', $fileModel);
        // Notifier tous les membres du projet (sauf l'uploader)
        $project = Project::with('users')->find($validated['project_id']);
        $task = null;
        if ($validated['task_id'] ?? null) {
            $task = \App\Models\Task::find($validated['task_id']);
        }
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
        return redirect()->route('files.index')->with('success', 'Fichier importé avec succès');
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
        return redirect()->route('files.index')->with('success', 'Fichier mis à jour');
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(File $file)
    {
        $file->load(['project']);
        if (!$file->project || !$file->project->isMember(auth()->user())) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        // Supprimer le fichier physique
        if ($file->file_path && \Storage::disk('public')->exists($file->file_path)) {
            \Storage::disk('public')->delete($file->file_path);
        }
        $file->delete();
        activity_log('delete', 'Suppression fichier', $file);
        return redirect()->route('files.index')->with('success', 'Fichier supprimé');
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
     * Télécharger plusieurs fichiers en ZIP
     */
    public function updateContent(Request $request, File $file)
    {
        // Authorize the action
        $this->authorize('update', $file);

        // Validate the request
        $request->validate([
            'content' => 'required|string',
        ]);

        // Ensure the file is a text file before attempting to write
        if (!str_starts_with($file->type, 'text/')) {
            return response()->json(['message' => 'Seuls les fichiers texte peuvent être modifiés de cette manière.'], 400);
        }

        try {
            Storage::disk('public')->put($file->file_path, $request->input('content'));
            activity_log('update', 'Modification contenu fichier texte', $file);
            return response()->json(['message' => 'Contenu du fichier mis à jour avec succès.']);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Erreur lors de la sauvegarde du contenu du fichier.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     *
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

<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use Inertia\Inertia;
use App\Models\Project;
use App\Models\Sprint;
use App\Events\TaskUpdated;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Notifications\UserActionMailNotification;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class TaskController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        try {
            $this->authorize('viewAny', Task::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        $query = Task::with(['assignedUser', 'project', 'sprint'])->whereHas('project', function ($q) {
            $q->whereHas('users', function ($q2) {
                $q2->where('user_id', auth()->id());
            });
        });

        if ($request->search) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }
        $tasks = $query->orderBy('created_at', 'desc')->paginate(10)->withQueryString();

        return Inertia::render('Tasks/Index', [
            'tasks' => $tasks,
            'filters' => $request->only('search'),
        ]);
    }

    public function create()
    {
        try {
            $this->authorize('create', Task::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $currentUser = auth()->user();
        $projects = $currentUser->hasRole('admin')
            ? Project::with(['users:id,name'])->get(['id', 'name'])
            : $currentUser->projects()->with(['users:id,name'])->wherePivot('role', 'manager')->get(['projects.id', 'projects.name']);
        $sprints = Sprint::whereIn('project_id', $projects->pluck('id'))->get();
        return Inertia::render('Tasks/Create', [
            'projects' => $projects,
            'sprints' => $sprints,
        ]);
    }

    public function store(Request $request)
    {
        try {
            $this->authorize('create', Task::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }
        
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|string|in:todo,in_progress,done',
            'priority' => 'required|string|in:low,medium,high',
            'due_date' => 'nullable|date',
            'project_id' => 'required|exists:projects,id',
            'sprint_id' => 'required|exists:sprints,id',
            'assigned_to' => 'nullable|exists:users,id',
            'is_paid' => 'boolean',
            'payment_reason' => 'required_if:is_paid,false|nullable|string|in:' . implode(',', [
                \App\Models\Task::REASON_VOLUNTEER,
                \App\Models\Task::REASON_ACADEMIC,
                \App\Models\Task::REASON_OTHER,
            ]),
            'amount' => 'required_if:is_paid,true|nullable|numeric|min:0',
        ]);

        $validated['created_by'] = auth()->id();
        $validated['payment_status'] = $validated['is_paid'] ? 
            \App\Models\Task::PAYMENT_STATUS_UNPAID : 
            \App\Models\Task::PAYMENT_STATUS_UNPAID;

        // Si c'est une tâche bénévole, marquer comme payée
        if (isset($validated['payment_reason']) && $validated['payment_reason'] === \App\Models\Task::REASON_VOLUNTEER) {
            $validated['is_paid'] = true;
            $validated['payment_status'] = \App\Models\Task::PAYMENT_STATUS_PAID;
            $validated['paid_at'] = now();
        }

        $task = Task::create($validated);
        
        // Envoyer une notification à tous les membres du projet
        $project = Project::find($validated['project_id']);
        if ($project) {
            $project->notifyMembers('task_created', [
                'task_id' => $task->id,
                'task_title' => $task->title,
                'task_description' => $task->description,
                'task_status' => $task->status,
                'task_priority' => $task->priority,
                'assigned_to' => $task->assigned_to ? $task->assignedUser->name : 'Non assigné',
                'due_date' => $task->due_date ? $task->due_date->format('d/m/Y') : 'Non définie',
                'created_by' => auth()->user()->name,
                'project_name' => $project->name,
            ]);
        }

        return redirect()->route('tasks.index')
            ->with('success', 'Tâche créée avec succès.');
    }

    /**
     * Télécharge un fichier attaché à une tâche
     *
     * @param  \App\Models\Task  $task
     * @param  int  $file
     * @return \Symfony\Component\HttpFoundation\StreamedResponse
     */
    public function downloadFile(Task $task, $file)
    {
        // Vérifier que l'utilisateur a accès à la tâche
        $this->authorize('view', $task);
        
        // Trouver le fichier dans les pièces jointes de la tâche
        $file = $task->files()->findOrFail($file);
        
        // Vérifier que le fichier existe dans le stockage
        if (!Storage::disk('public')->exists($file->file_path)) {
            abort(404, 'Le fichier demandé n\'existe plus.');
        }
        
        // Télécharger le fichier
        return Storage::disk('public')->download($file->file_path, $file->name);
    }
    
    /**
     * Affiche les détails d'une tâche
     *
     * @param  \App\Models\Task  $task
     * @return \Inertia\Response
     */
    public function show(Task $task)
    {
        try {
            $this->authorize('view', $task);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        
        // Charger les relations nécessaires avec les rôles
        $task->load([
            'project.users' => function($query) {
                $query->select('users.id', 'users.name', 'users.email')
                      ->withPivot('role');
            },
            'sprint',
            'assignedUser',
            'files',
            'comments.user'
        ]);
        
        $user = auth()->user();
        $payments = collect(); 

        if ($user->hasRole('admin') || $task->project->users()->where('user_id', $user->id)->wherePivot('role', 'manager')->exists()) {
            // Admin or project manager: retrieve all payments for the task
            $payments = $task->payments()->with('user')->get();
        } else {
            // Regular member: retrieve only their own payment for the task
            $payment = $task->payments()->where('user_id', $user->id)->first();
            if ($payment) {
                $payments->push($payment->load('user'));
            }
        }

        // Ajouter le rôle de l'utilisateur actuel pour faciliter la vérification côté frontend
        $currentUserRole = $task->project->users->find($user->id)?->pivot->role;
        
        return Inertia::render('Tasks/Show', [
            'task' => $task,
            'payments' => $payments,
            'projectMembers' => $task->project->users,
            'currentUserRole' => $currentUserRole
        ]);
    }

    public function savePaymentInfo(Request $request, Task $task)
    {
        $user = auth()->user();

        // Check if the authenticated user is part of the project associated with the task
        $isProjectMember = $task->project->users()->where('user_id', $user->id)->exists();

        if (!$isProjectMember) {
            return response()->json(['message' => 'Unauthorized to save payment information for this task' . $task->id], 403);
        }
        
        $validated = $request->validate([
            'payment_method' => 'required|in:mtn,moov,celtis',
            'phone_number' => 'required|string|max:20',
            'user_id' => 'nullable|exists:users,id', // Add user_id validation
        ]);

        $targetUserId = $user->id; // Default to current authenticated user

        // If an admin or project manager is saving for another user
        if (($user->hasRole('admin') || $task->project->users()->where('user_id', $user->id)->wherePivot('role', 'manager')->exists()) && $request->has('user_id')) {
            $targetUserId = $validated['user_id'];
        }

        $payment = \App\Models\TaskPayment::updateOrCreate(
            ['task_id' => $task->id, 'user_id' => $targetUserId],
            ['payment_method' => $validated['payment_method'], 'phone_number' => $validated['phone_number'], 'status' => 'pending']
        );
        return response()->json($payment);
    }

    public function validatePayment(Task $task, \App\Models\TaskPayment $taskPayment)
    {
        try {
            $this->authorize('validatePayment', $task);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }
        $payment = $taskPayment; // Use the injected TaskPayment instance
        if (!$payment) {
            return response()->json(['message' => 'Payment info not found'], 404);
        }
        $payment->status = 'validated';
        $payment->save();

        // Send notification email to user
        $user = $payment->user;
        $subject = 'Paiement validé pour la tâche: ' . $task->title;
        $message = 'Bonjour ' . $user->name . ',<br>Votre paiement pour la tâche <b>' . $task->title . '</b> a été validé.';
        $actionUrl = url('/tasks/' . $task->id);
        $actionText = 'Voir la tâche';
        $user->notify(new UserActionMailNotification($subject, $message, $actionUrl, $actionText, [
            'task_id' => $task->id,
        ]));

        return response()->json(['message' => 'Payment validated']);
    }

    public function edit(Task $task)
    {
        try {
            $this->authorize('update', $task);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $currentUser = auth()->user();
        $projects = $currentUser->hasRole('admin')
            ? Project::with(['users:id,name'])->get(['id', 'name'])
            : $currentUser->projects()->with(['users:id,name'])->wherePivot('role', 'manager')->get(['projects.id', 'projects.name']);
        $sprints = Sprint::whereIn('project_id', $projects->pluck('id'))->get();

        return Inertia::render('Tasks/Edit', [
            'task' => $task,
            'projects' => $projects,
            'sprints' => $sprints,
        ]);
    }

    public function update(Request $request, Task $task)
    {
        try {
            $this->authorize('update', $task);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'status' => 'required|string|in:todo,in_progress,done',
            'priority' => 'required|string|in:low,medium,high',
            'due_date' => 'nullable|date',
            'project_id' => 'required|exists:projects,id',
            'sprint_id' => 'required|exists:sprints,id',
            'assigned_to' => 'nullable|exists:users,id',
            'is_paid' => 'boolean',
            'payment_status' => 'sometimes|string|in:' . implode(',', [
                \App\Models\Task::PAYMENT_STATUS_UNPAID,
                \App\Models\Task::PAYMENT_STATUS_PENDING,
                \App\Models\Task::PAYMENT_STATUS_PAID,
                \App\Models\Task::PAYMENT_STATUS_FAILED,
            ]),
            'payment_reason' => 'required_if:is_paid,false|nullable|string|in:' . implode(',', [
                \App\Models\Task::REASON_VOLUNTEER,
                \App\Models\Task::REASON_ACADEMIC,
                \App\Models\Task::REASON_OTHER,
            ]),
            'amount' => 'required_if:is_paid,true|nullable|numeric|min:0',
        ]);

        // Sauvegarder l'ancien statut pour la comparaison
        $oldStatus = $task->status;
        $oldAssignee = $task->assigned_to;

        // Mettre à jour la tâche
        $task->update($validated);

        // Si le statut a changé ou si la tâche a été réassignée, envoyer une notification
        if ($oldStatus !== $task->status || $oldAssignee != $task->assigned_to) {
            $project = $task->project;
            if ($project) {
                $project->notifyMembers('task_updated', [
                    'task_id' => $task->id,
                    'task_title' => $task->title,
                    'task_description' => $task->description,
                    'task_status' => $task->status,
                    'old_status' => $oldStatus !== $task->status ? $oldStatus : null,
                    'task_priority' => $task->priority,
                    'assigned_to' => $task->assigned_to ? $task->assignedUser->name : 'Non assigné',
                    'due_date' => $task->due_date ? $task->due_date->format('d/m/Y') : 'Non définie',
                    'updated_by' => auth()->user()->name,
                    'project_name' => $project->name,
                ]);
            }
        }

        // Déclencher l'événement de mise à jour de tâche
        event(new TaskUpdated($task));

        return redirect()->route('tasks.show', $task->id)
            ->with('success', 'Tâche mise à jour avec succès.');
    }

    public function destroy(Task $task)
    {
        try {
            $this->authorize('delete', $task);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $task->delete();
        return redirect()->route('tasks.index');
    }

    public function kanban()
    {
        try {
            $this->authorize('viewAny', Task::class);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $tasks = Task::whereHas('project', function ($q) {
            $q->whereHas('users', function ($q2) {
                $q2->where('user_id', auth()->id());
            });
        })->get()->groupBy('status');

        return Inertia::render('Tasks/Kanban', ['tasks' => $tasks]);
    }

    public function comment(Request $request, Task $task)
    {
        try {
            $this->authorize('comment', $task);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        // ...
    }

    public function uploadFile(Request $request, Task $task)
    {
        try {
            $this->authorize('uploadFile', $task);
        } catch (\Illuminate\Auth\Access\AuthorizationException $e) {
            return \Inertia\Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        // ...
    }

    /**
     * Generate and download a receipt for a paid task
     *
     * @param Task $task
     * @return \Illuminate\Http\Response
     */
    public function downloadReceipt(Task $task)
    {
        // Charger les relations nécessaires
        $task->load([
            'payments.user',
            'project.users' => function($query) {
                $query->wherePivot('role', 'manager');
            },
            'project.users.roles'
        ]);
        
        // Vérifier s'il y a des paiements
        if ($task->payments->isEmpty()) {
            abort(404, 'Aucun paiement trouvé pour cette tâche');
        }

        // Récupérer le paiement pour l'utilisateur actuel ou spécifié
        $userId = request()->query('user_id', auth()->id());
        $payment = $task->payments->where('user_id', $userId)->first();

        if (!$payment || !$payment->user) {
            abort(404, 'Aucun paiement valide trouvé pour cet utilisateur');
        }

        // Récupérer l'utilisateur du paiement
        $user = $payment->user;
        
        // Récupérer le premier gestionnaire du projet
        $projectManager = $task->project->users->first();

        // Générer le PDF
        $pdf = \PDF::loadView('receipts.task_payment', [
            'task' => $task,
            'payment' => $payment,
            'user' => $user,
            'projectManager' => $projectManager
        ]);

        // Définir la taille et l'orientation de la page
        $pdf->setPaper('A4', 'portrait');

        // Télécharger le PDF avec un nom de fichier personnalisé
        $filename = 'recu-paiement-' . $task->id . '-' . $user->id . '.pdf';
        return $pdf->download($filename);
    }
}

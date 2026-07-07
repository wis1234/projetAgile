<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Task;
use Inertia\Inertia;
use App\Models\Project;
use App\Models\Sprint;
use App\Models\User;
use App\Events\TaskUpdated;
use Illuminate\Foundation\Auth\Access\AuthorizationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Notifications\UserActionMailNotification;
use App\Notifications\TaskAssignedNotification;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    use AuthorizesRequests;

    public function index(Request $request)
    {
        try {
            $this->authorize('viewAny', Task::class);
        } catch (AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }

        $user = auth()->user();

        // Base query — only tasks in projects the user belongs to
        $baseQuery = Task::with([
            'assignedUser:id,name,email,profile_photo_path',
            'project:id,name',
            'sprint:id,name',
        ])->whereHas('project', function ($q) use ($user) {
            $q->whereHas('users', fn($q2) => $q2->where('user_id', $user->id));
        });

        // ── Filters ────────────────────────────────────────────────
        if ($request->filled('search')) {
            $baseQuery->where('title', 'like', '%' . $request->search . '%');
        }

        if ($request->filled('status')) {
            $baseQuery->where('status', $request->status);
        }

        if ($request->filled('priority')) {
            $baseQuery->where('priority', $request->priority);
        }

        if ($request->filled('project_id')) {
            $baseQuery->where('project_id', $request->project_id);
        }

        if ($request->filled('assigned_to')) {
            $baseQuery->where('assigned_to', $request->assigned_to);
        }

        if ($request->filled('due_from')) {
            $baseQuery->whereDate('due_date', '>=', $request->due_from);
        }

        if ($request->filled('due_to')) {
            $baseQuery->whereDate('due_date', '<=', $request->due_to);
        }

        if ($request->filled('is_paid')) {
            $baseQuery->where('is_paid', $request->boolean('is_paid'));
        }

        // ── Sorting ────────────────────────────────────────────────
        $sortField = in_array($request->sort_by, ['title', 'status', 'priority', 'due_date', 'created_at'])
            ? $request->sort_by
            : 'created_at';
        $sortDir = $request->sort_dir === 'asc' ? 'asc' : 'desc';
        $baseQuery->orderBy($sortField, $sortDir);

        // ── Paginate ───────────────────────────────────────────────
        $tasks = $baseQuery->paginate(12)->withQueryString()
            ->through(function ($task) use ($user) {
                $task->project_is_muted = false;
                return $task;
            });

        // ── Server-side user statistics ────────────────────────────
        // Scoped to the same project membership, independent of filters
        $statsQuery = Task::select(
                'assigned_to',
                DB::raw('COUNT(*) as total'),
                DB::raw("SUM(CASE WHEN status = 'done' THEN 1 ELSE 0 END) as done_count"),
                DB::raw("SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count"),
                DB::raw("SUM(CASE WHEN status = 'todo' THEN 1 ELSE 0 END) as todo_count"),
                DB::raw("SUM(CASE WHEN status = 'done' AND updated_at <= due_date THEN 1 ELSE 0 END) as on_time_count"),
                DB::raw("SUM(CASE WHEN status = 'done' AND updated_at > due_date THEN 1 ELSE 0 END) as late_count")
            )
            ->whereNotNull('assigned_to')
            ->whereHas('project', function ($q) use ($user) {
                $q->whereHas('users', fn($q2) => $q2->where('user_id', $user->id));
            })
            ->groupBy('assigned_to')
            ->with('assignedUser:id,name,email,profile_photo_path')
            ->orderByDesc('total')
            ->get()
            ->map(function ($stat) {
                return [
                    'user'             => $stat->assignedUser,
                    'total'            => (int) $stat->total,
                    'done'             => (int) $stat->done_count,
                    'in_progress'      => (int) $stat->in_progress_count,
                    'todo'             => (int) $stat->todo_count,
                    'on_time'          => (int) $stat->on_time_count,
                    'late'             => (int) $stat->late_count,
                    'completion_rate'  => $stat->total > 0
                        ? round(($stat->done_count / $stat->total) * 100)
                        : 0,
                    'on_time_rate'     => $stat->done_count > 0
                        ? round(($stat->on_time_count / $stat->done_count) * 100)
                        : 0,
                ];
            });

        // ── Global summary counts (same scope, no filters) ─────────
        $summary = Task::whereHas('project', function ($q) use ($user) {
                $q->whereHas('users', fn($q2) => $q2->where('user_id', $user->id));
            })
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status='todo' THEN 1 ELSE 0 END) as todo,
                SUM(CASE WHEN status='in_progress' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN status='done' THEN 1 ELSE 0 END) as done,
                SUM(CASE WHEN due_date < NOW() AND status != 'done' THEN 1 ELSE 0 END) as overdue
            ")
            ->first();

        // ── Filter options (projects & members visible to user) ────
        $projectOptions = $user->projects()
            ->select('projects.id', 'projects.name')
            ->orderBy('projects.name')
            ->get();

        $memberOptions = User::whereHas('projects', function ($q) use ($user) {
                $q->whereHas('users', fn($q2) => $q2->where('user_id', $user->id));
            })
            ->select('id', 'name')
            ->orderBy('name')
            ->get();

        return Inertia::render('Tasks/Index', [
            'tasks'          => $tasks,
            'filters'        => $request->only([
                'search', 'status', 'priority', 'project_id',
                'assigned_to', 'due_from', 'due_to', 'is_paid',
                'sort_by', 'sort_dir',
            ]),
            'userStats'      => $statsQuery,
            'summary'        => $summary,
            'projectOptions' => $projectOptions,
            'memberOptions'  => $memberOptions,
        ]);
    }

public function create(Request $request)
{
    try {
        $this->authorize('create', Task::class);
    } catch (AuthorizationException $e) {
        return Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
    }

    $currentUser = auth()->user();

    // Récupération des projets accessibles (admin → tous, sinon projets où l'utilisateur est manager)
    if ($currentUser->hasRole('admin')) {
        $projects = Project::with(['users:id,name'])->get(['id', 'name']);
        $allowedProjectIds = $projects->pluck('id')->toArray();
    } else {
        $projects = $currentUser->projects()
            ->with(['users:id,name'])
            ->wherePivot('role', 'manager')
            ->get(['projects.id', 'projects.name']);
        $allowedProjectIds = $projects->pluck('id')->toArray();
    }

    // Récupération du project_id depuis l'URL
    $selectedProjectId = $request->query('project_id');

    // Vérification que le projet pré‑sélectionné est bien autorisé
    if ($selectedProjectId && !in_array((int)$selectedProjectId, $allowedProjectIds)) {
        $selectedProjectId = null;
    }

    // Récupération des sprints des projets autorisés
    $sprints = Sprint::whereIn('project_id', $allowedProjectIds)->get();

    return Inertia::render('Tasks/Create', [
        'projects' => $projects,
        'sprints'  => $sprints,
        'selectedProjectId' => $selectedProjectId,
    ]);
}


    public function store(Request $request)
    {
        try {
            $this->authorize('create', Task::class);
        } catch (AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }

        $validated = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string',
            'status'         => 'required|string|in:todo,in_progress,done',
            'priority'       => 'required|string|in:low,medium,high',
            'due_date'       => ['nullable', 'date_format:Y-m-d H:i:s'],
            'project_id'     => 'required|exists:projects,id',
            'sprint_id'      => 'required|exists:sprints,id',
            'assigned_to'    => 'nullable|exists:users,id',
            'is_paid'        => 'boolean',
            'payment_reason' => 'required_if:is_paid,false|nullable|string|in:' . implode(',', [
                \App\Models\Task::REASON_VOLUNTEER,
                \App\Models\Task::REASON_ACADEMIC,
                \App\Models\Task::REASON_OTHER,
            ]),
            'amount'         => 'required_if:is_paid,true|nullable|numeric|min:0',
        ]);

        $validated['created_by']     = auth()->id();
        $validated['payment_status'] = \App\Models\Task::PAYMENT_STATUS_UNPAID;

        if (isset($validated['payment_reason']) && $validated['payment_reason'] === \App\Models\Task::REASON_VOLUNTEER) {
            $validated['is_paid']        = true;
            $validated['payment_status'] = \App\Models\Task::PAYMENT_STATUS_PAID;
            $validated['paid_at']        = now();
        }

        $task    = Task::create($validated);
        $project = Project::find($validated['project_id']);

        if ($project) {
            $projectPath = 'files/' . $project->id;
            Storage::disk('public')->makeDirectory($projectPath, 0755, true);

            $fileName = 'Suivi de la tâche ' . Str::slug($task->title);
            $filePath = $projectPath . '/' . $fileName;

            $content  = "Ce fichier est destiné au suivi de la tâche " . $task->title . "\n\n";
            $content .= "Vous pouvez utiliser ce fichier pour noter les mises à jour, les commentaires ou toute information utile concernant cette tâche.\n";
            $content .= "Tous les membres de l'équipe peuvent collaborer sur ce document.\n";
            $content .= "...R A D....\n";

            Storage::disk('public')->put($filePath, $content);

            \App\Models\File::create([
                'name'        => $fileName,
                'file_path'   => $filePath,
                'type'        => 'text/plain',
                'size'        => Storage::disk('public')->size($filePath),
                'user_id'     => auth()->id(),
                'project_id'  => $project->id,
                'task_id'     => $task->id,
                'description' => 'Fichier de suivi pour la tâche : ' . $task->title,
                'status'      => 'active',
            ]);

            if ($task->assigned_to) {
                $assignedUser = \App\Models\User::find($task->assigned_to);
                if ($assignedUser) {
                    $assignedUser->notify(new TaskAssignedNotification($task));
                }
            }
        }

        return redirect()->route('tasks.index')->with('success', 'Tâche créée avec succès.');
    }

    public function downloadFile(Task $task, $file)
    {
        $this->authorize('view', $task);
        $file = $task->files()->findOrFail($file);

        if (!Storage::disk('public')->exists($file->file_path)) {
            abort(404, 'Le fichier demandé n\'existe plus.');
        }

        return Storage::disk('public')->download($file->file_path, $file->name);
    }

    public function getTaskDetails(Task $task)
    {
        $this->authorize('view', $task);

        return response()->json([
            'success' => true,
            'task'    => [
                'id'       => $task->id,
                'title'    => $task->title,
                'sprint_id' => $task->sprint_id,
                'sprint'   => $task->sprint ? [
                    'id'     => $task->sprint->id,
                    'name'   => $task->sprint->name,
                    'status' => $task->sprint->status,
                ] : null,
            ],
        ]);
    }

    public function show(Task $task)
    {
        try {
            $this->authorize('view', $task);
        } catch (AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }

        $task->load([
            'project.users' => function ($query) {
                $query->select('users.id', 'users.name', 'users.email')->withPivot('role');
            },
            'sprint',
            'assignedUser',
            'files',
            'comments.user',
        ]);

        $user     = auth()->user();
        $payments = collect();

        if ($user->hasRole('admin') || $task->project->users()->where('user_id', $user->id)->wherePivot('role', 'manager')->exists()) {
            $payments = $task->payments()->with('user')->get();
        } else {
            $payment = $task->payments()->where('user_id', $user->id)->first();
            if ($payment) {
                $payments->push($payment->load('user'));
            }
        }

        $currentUserRole = $task->project->users->find($user->id)?->pivot->role;

        return Inertia::render('Tasks/Show', [
            'task'           => $task,
            'payments'       => $payments,
            'projectMembers' => $task->project->users,
            'currentUserRole' => $currentUserRole,
        ]);
    }

    public function savePaymentInfo(Request $request, Task $task)
    {
        $user            = auth()->user();
        $isProjectMember = $task->project->users()->where('user_id', $user->id)->exists();

        if (!$isProjectMember) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'payment_method' => 'required|in:mtn,moov,celtis',
            'phone_number'   => 'required|string|max:20',
            'user_id'        => 'nullable|exists:users,id',
        ]);

        $targetUserId = $user->id;

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
        } catch (AuthorizationException $e) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $taskPayment->status = 'validated';
        $taskPayment->save();

        $user      = $taskPayment->user;
        $subject   = 'Paiement validé pour la tâche: ' . $task->title;
        $message   = 'Bonjour ' . $user->name . ',<br>Votre paiement pour la tâche <b>' . $task->title . '</b> a été validé.';
        $actionUrl  = url('/tasks/' . $task->id);
        $actionText = 'Voir la tâche';

        $user->notify(new UserActionMailNotification($subject, $message, $actionUrl, $actionText, ['task_id' => $task->id]));

        return response()->json(['message' => 'Payment validated']);
    }

    public function edit(Task $task)
    {
        try {
            $this->authorize('update', $task);
        } catch (AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }

        $currentUser = auth()->user();
        $projects    = $currentUser->hasRole('admin')
            ? Project::with(['users:id,name'])->get(['id', 'name'])
            : $currentUser->projects()->with(['users:id,name'])->wherePivot('role', 'manager')->get(['projects.id', 'projects.name']);
        $sprints     = Sprint::whereIn('project_id', $projects->pluck('id'))->get();

        return Inertia::render('Tasks/Edit', [
            'task'     => $task,
            'projects' => $projects,
            'sprints'  => $sprints,
        ]);
    }

    public function update(Request $request, Task $task)
    {
        try {
            $this->authorize('update', $task);
        } catch (AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
        }

        $validated = $request->validate([
            'title'          => 'required|string|max:255',
            'description'    => 'nullable|string',
            'status'         => 'required|string|in:todo,in_progress,done',
            'priority'       => 'required|string|in:low,medium,high',
            'due_date'       => ['nullable', 'date_format:Y-m-d H:i:s'],
            'project_id'     => 'required|exists:projects,id',
            'sprint_id'      => 'required|exists:sprints,id',
            'assigned_to'    => 'nullable|exists:users,id',
            'is_paid'        => 'boolean',
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
            'amount'         => 'required_if:is_paid,true|nullable|numeric|min:0',
        ]);

        $oldStatus  = $task->status;
        $oldAssignee = $task->assigned_to;

        $task->update($validated);

        if ($oldAssignee != $task->assigned_to && $task->assigned_to) {
            $assignedUser = \App\Models\User::find($task->assigned_to);
            if ($assignedUser) {
                $assignedUser->notify(new TaskAssignedNotification($task));
            }
        }

        if ($oldStatus !== $task->status || $oldAssignee != $task->assigned_to) {
            $project = $task->project;
            if ($project) {
                $project->notifyMembers('task_updated', [
                    'task_id'       => $task->id,
                    'task_title'    => $task->title,
                    'task_status'   => $task->status,
                    'old_status'    => $oldStatus !== $task->status ? $oldStatus : null,
                    'task_priority' => $task->priority,
                    'assigned_to'   => $task->assigned_to ? $task->assignedUser->name : 'Non assigné',
                    'due_date'      => $task->due_date ? $task->due_date->format('d/m/Y') : 'Non définie',
                    'updated_by'    => auth()->user()->name,
                    'project_name'  => $project->name,
                ]);
            }
        }

        event(new TaskUpdated($task));

        return redirect()->route('tasks.show', $task->id)->with('success', 'Tâche mise à jour avec succès.');
    }

    public function destroy(Task $task)
    {
        try {
            $this->authorize('delete', $task);
        } catch (AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
        $task->delete();
        return redirect()->route('tasks.index');
    }

    public function kanban()
    {
        try {
            $this->authorize('viewAny', Task::class);
        } catch (AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }

        $tasks = Task::whereHas('project', function ($q) {
            $q->whereHas('users', fn($q2) => $q2->where('user_id', auth()->id()));
        })->get()->groupBy('status');

        return Inertia::render('Tasks/Kanban', ['tasks' => $tasks]);
    }

    public function comment(Request $request, Task $task)
    {
        try {
            $this->authorize('comment', $task);
        } catch (AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
    }

    public function uploadFile(Request $request, Task $task)
    {
        try {
            $this->authorize('uploadFile', $task);
        } catch (AuthorizationException $e) {
            return Inertia::render('Error403')->toResponse(request())->setStatusCode(403);
        }
    }

    public function downloadReceipt(Task $task)
    {
        $task->load([
            'payments.user',
            'project.users' => fn($q) => $q->wherePivot('role', 'manager'),
            'project.users.roles',
        ]);

        if ($task->payments->isEmpty()) {
            abort(404, 'Aucun paiement trouvé pour cette tâche');
        }

        $userId  = request()->query('user_id', auth()->id());
        $payment = $task->payments->where('user_id', $userId)->first();

        if (!$payment || !$payment->user) {
            abort(404, 'Aucun paiement valide trouvé pour cet utilisateur');
        }

        $user           = $payment->user;
        $projectManager = $task->project->users->first();

        if (!$projectManager) {
            abort(404, 'Aucun gestionnaire de projet trouvé pour cette tâche');
        }

        $pdf = \PDF::loadView('receipts.task_payment', [
            'task'           => $task,
            'payment'        => $payment,
            'user'           => $user,
            'projectManager' => $projectManager,
        ]);

        $pdf->setPaper('A4', 'portrait');
        $filename = 'recu-paiement-' . $task->id . '-' . $user->id . '.pdf';

        return $pdf->download($filename);
    }
}

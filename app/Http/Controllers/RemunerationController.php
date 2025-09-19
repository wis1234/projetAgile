<?php

namespace App\Http\Controllers;

use App\Models\Remuneration;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class RemunerationController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
        
        // Exclude dashboard from resource authorization
        $this->middleware('can:viewAny,App\Models\Remuneration')
             ->except(['dashboard']);
             
        // Apply resource authorization to other methods
        $this->middleware(function ($request, $next) {
            if (!in_array($request->route()->getActionMethod(), ['dashboard'])) {
                $this->authorizeResource(Remuneration::class, 'remuneration');
            }
            return $next($request);
        });
    }

    /**
     * Affiche la liste des rémunérations de l'utilisateur connecté
     * Les administrateurs voient toutes les rémunérations
     */
    public function index(Request $request)
    {
        $this->authorize('viewAny', Remuneration::class);
        
        $filters = $request->only(['search', 'status', 'type', 'start_date', 'end_date']);
        $user = auth()->user();
        $isAdmin = $user->hasRole('admin');
        
        // Récupérer les rémunérations standards
        $query = Remuneration::with(['user', 'task']);
        
        // Filtrage des rémunérations standards
        if (!empty($filters['search'])) {
            $query->where(function($q) use ($filters) {
                $q->whereHas('user', function($q) use ($filters) {
                    $q->where('name', 'like', "%{$filters['search']}%");
                });
                $q->orWhere('description', 'like', "%{$filters['search']}%");
            });
        }
        
        $statusFilter = !empty($filters['status']) && $filters['status'] !== 'all' ? $filters['status'] : null;
        $typeFilter = !empty($filters['type']) && $filters['type'] !== 'all' ? $filters['type'] : null;
        
        if ($statusFilter) {
            $query->where('status', $statusFilter);
        }
        
        if ($typeFilter) {
            $query->where('type', $typeFilter);
        }
        
        if (!empty($filters['start_date'])) {
            $query->whereDate('payment_date', '>=', $filters['start_date']);
        }
        
        if (!empty($filters['end_date'])) {
            $query->whereDate('payment_date', '<=', $filters['end_date']);
        }
        
        // Pour les non-admins, ne montrer que leurs propres rémunérations
        if (!$isAdmin) {
            $query->where('user_id', $user->id);
        }
        
        // Récupérer les paiements de tâches
        $taskPaymentsQuery = \DB::table('task_payments')
            ->join('tasks', 'task_payments.task_id', '=', 'tasks.id')
            ->join('users', 'task_payments.user_id', '=', 'users.id')
            ->leftJoin('projects', 'tasks.project_id', '=', 'projects.id')
            ->select(
                'task_payments.id',
                'task_payments.status',
                'task_payments.created_at',
                'task_payments.updated_at',
                'tasks.id as task_id',
                'tasks.title as task_title',
                'tasks.amount',
                'tasks.due_date',
                'tasks.priority',
                'users.id as user_id',
                'users.name as user_name',
                'users.email as user_email',
                'users.profile_photo_path',
                'projects.id as project_id',
                'projects.name as project_name'
            )
            ->when(!$isAdmin, function($q) use ($user) {
                return $q->where('task_payments.user_id', $user->id);
            });
            
        // Appliquer les filtres aux tâches
        if (!empty($filters['search'])) {
            $taskPaymentsQuery->where(function($q) use ($filters) {
                $q->where('tasks.title', 'like', "%{$filters['search']}%")
                  ->orWhere('users.name', 'like', "%{$filters['search']}%");
            });
        }
        
        if ($statusFilter) {
            $taskPaymentsQuery->where('task_payments.status', $statusFilter === 'paid' ? 'validated' : $statusFilter);
        }
        
        if ($typeFilter && $typeFilter === 'task') {
            // On ne filtre que si c'est spécifiquement demandé
        } elseif ($typeFilter) {
            // Si un autre type est sélectionné, on ne montre pas les tâches
            $taskPaymentsQuery->whereRaw('1=0');
        }
        
        if (!empty($filters['start_date'])) {
            $taskPaymentsQuery->whereDate('task_payments.created_at', '>=', $filters['start_date']);
        }
        
        if (!empty($filters['end_date'])) {
            $taskPaymentsQuery->whereDate('task_payments.created_at', '<=', $filters['end_date']);
        }
        
        // Récupérer les statistiques
        $standardStats = [
            'total_earned' => (clone $query)->where('status', 'paid')->sum('amount') ?? 0,
            'pending_amount' => (clone $query)->where('status', 'pending')->sum('amount') ?? 0,
            'completed_tasks' => (clone $query)->where('type', 'task')->where('status', 'paid')->count(),
            'total_count' => (clone $query)->count(),
        ];
        
        $taskStats = [
            'total_earned' => (clone $taskPaymentsQuery)->where('task_payments.status', 'validated')
                ->sum('tasks.amount') ?? 0,
            'pending_amount' => (clone $taskPaymentsQuery)->where('task_payments.status', 'pending')
                ->sum('tasks.amount') ?? 0,
            'completed_tasks' => (clone $taskPaymentsQuery)->where('task_payments.status', 'validated')
                ->count(),
            'total_count' => (clone $taskPaymentsQuery)->count(),
        ];
        
        // Combiner les statistiques
        $stats = [
            'total_earned' => $standardStats['total_earned'] + $taskStats['total_earned'],
            'pending_amount' => $standardStats['pending_amount'] + $taskStats['pending_amount'],
            'completed_tasks' => $standardStats['completed_tasks'] + $taskStats['completed_tasks'],
            'total_count' => $standardStats['total_count'] + $taskStats['total_count'],
        ];
        
        // Récupérer les données paginées
        $perPage = $request->input('per_page', 15);
        
        // Récupérer les rémunérations standards
        $standardRemunerations = $query->latest('payment_date')
            ->paginate(min($perPage, 100), ['*'], 'standard_page')
            ->withQueryString();
            
        // Récupérer les paiements de tâches
        $taskPayments = (clone $taskPaymentsQuery)
            ->orderBy('task_payments.created_at', 'desc')
            ->paginate(min($perPage, 100), ['*'], 'task_page')
            ->withQueryString();
        
        // Formater les rémunérations standards
        $formattedStandardRemunerations = $standardRemunerations->through(function ($remuneration) {
            $task = $remuneration->task;
            $user = $remuneration->user;
            
            return [
                'id' => 'r_' . $remuneration->id,
                'source' => 'remuneration',
                'amount' => $remuneration->amount,
                'formatted_amount' => number_format($remuneration->amount, 2, ',', ' ') . ' €',
                'type' => $remuneration->type,
                'type_label' => $this->getTypeLabel($remuneration->type),
                'status' => $remuneration->status,
                'status_label' => $this->getStatusLabel($remuneration->status),
                'payment_date' => $remuneration->payment_date,
                'formatted_date' => $remuneration->payment_date ? \Carbon\Carbon::parse($remuneration->payment_date)->format('d/m/Y') : 'N/A',
                'created_at' => $remuneration->created_at,
                'formatted_created_at' => $remuneration->created_at ? $remuneration->created_at->format('d/m/Y H:i') : 'N/A',
                'description' => $remuneration->description,
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->profile_photo_url,
                ] : null,
                'task' => $task ? [
                    'id' => $task->id,
                    'title' => $task->title,
                    'status' => $task->status,
                    'priority' => $task->priority,
                    'due_date' => $task->due_date ? $task->due_date->format('d/m/Y') : null,
                    'project' => $task->project ? [
                        'id' => $task->project->id,
                        'name' => $task->project->name,
                    ] : null,
                ] : null,
            ];
        });
        
        // Formater les paiements de tâches
        $formattedTaskPayments = $taskPayments->through(function ($payment) {
            return [
                'id' => 't_' . $payment->id,
                'source' => 'task_payment',
                'amount' => $payment->amount,
                'formatted_amount' => number_format($payment->amount, 2, ',', ' ') . ' €',
                'type' => 'task',
                'type_label' => 'Tâche terminée',
                'status' => $payment->status === 'validated' ? 'paid' : $payment->status,
                'status_label' => $this->getStatusLabel($payment->status === 'validated' ? 'paid' : $payment->status),
                'payment_date' => $payment->created_at,
                'formatted_date' => $payment->created_at ? \Carbon\Carbon::parse($payment->created_at)->format('d/m/Y') : 'N/A',
                'created_at' => $payment->created_at,
                'formatted_created_at' => $payment->created_at ? \Carbon\Carbon::parse($payment->created_at)->format('d/m/Y H:i') : 'N/A',
                'description' => $payment->task_title,
                'user' => [
                    'id' => $payment->user_id,
                    'name' => $payment->user_name,
                    'email' => $payment->user_email,
                    'avatar' => $payment->profile_photo_path 
                        ? \Illuminate\Support\Facades\Storage::url($payment->profile_photo_path)
                        : 'https://ui-avatars.com/api/?name=' . urlencode($payment->user_name) . '&color=7F9CF5&background=EBF4FF',
                ],
                'task' => [
                    'id' => $payment->task_id, // Ajout de l'ID de la tâche
                    'title' => $payment->task_title,
                    'status' => $payment->status === 'validated' ? 'completed' : $payment->status,
                    'priority' => $payment->priority,
                    'due_date' => $payment->due_date ? \Carbon\Carbon::parse($payment->due_date)->format('d/m/Y') : null,
                    'project' => $payment->project_id ? [
                        'id' => $payment->project_id,
                        'name' => $payment->project_name,
                    ] : null,
                ],
            ];
        });
        
        // Fusionner et trier les deux collections
        $allRemunerations = collect()
            ->merge($formattedStandardRemunerations->items())
            ->merge($formattedTaskPayments->items())
            ->sortByDesc('created_at')
            ->values();
            
        // Créer un paginateur personnalisé
        $remunerations = new \Illuminate\Pagination\LengthAwarePaginator(
            $allRemunerations,
            $standardRemunerations->total() + $taskPayments->total(),
            $perPage,
            $standardRemunerations->currentPage(),
            ['path' => $request->url(), 'pageName' => 'page']
        );
        
        return Inertia::render('Remunerations/Index', [
            'remunerations' => $remunerations,
            'filters' => $filters,
            'stats' => $stats,
            'isAdmin' => $isAdmin,
            'filterOptions' => [
                'statuses' => [
                    ['value' => 'all', 'label' => 'Tous les statuts'],
                    ['value' => 'pending', 'label' => 'En attente'],
                    ['value' => 'paid', 'label' => 'Payé'],
                    ['value' => 'cancelled', 'label' => 'Annulé'],
                ],
                'types' => [
                    ['value' => 'all', 'label' => 'Tous les types'],
                    ['value' => 'task', 'label' => 'Tâche terminée'],
                    ['value' => 'bonus', 'label' => 'Bonus'],
                    ['value' => 'refund', 'label' => 'Remboursement'],
                    ['value' => 'other', 'label' => 'Autre'],
                ],
            ],
        ]);
    }

    /**
     * Affiche les statistiques de rémunération de l'utilisateur
     * Les administrateurs voient toutes les statistiques, les utilisateurs ne voient que les leurs
     */
    public function dashboard()
    {
        $user = auth()->user();
        $isAdmin = $user->isAdmin();
        
        // Journalisation pour le débogage
        \Log::info('Accès au tableau de bord des rémunérations', [
            'user_id' => $user->id,
            'is_admin' => $isAdmin
        ]);
        
        // Récupérer les statistiques de base
        $stats = $this->getUserRemunerationStats($isAdmin ? null : $user->id);
        
        // Journalisation des statistiques de base
        \Log::debug('Statistiques de base', $stats);
        
        // Récupérer les statistiques des paiements de tâches
        $taskStats = \DB::table('task_payments')
            ->join('tasks', 'task_payments.task_id', '=', 'tasks.id')
            ->when(!$isAdmin, function($query) use ($user) {
                return $query->where('task_payments.user_id', $user->id);
            })
            ->select([
                \DB::raw('COALESCE(SUM(CASE WHEN task_payments.status = "validated" THEN tasks.amount ELSE 0 END), 0) as total_paid'),
                \DB::raw('COUNT(DISTINCT task_payments.id) as total_payments'),
                \DB::raw('COALESCE(SUM(CASE WHEN task_payments.status = "pending" THEN tasks.amount ELSE 0 END), 0) as pending_amount'),
                \DB::raw('COUNT(DISTINCT CASE WHEN task_payments.status = "pending" THEN task_payments.id END) as pending_payments')
            ])
            ->first();
        
        // Journalisation des statistiques des tâches
        \Log::debug('Statistiques des tâches', (array)$taskStats);
        
        // Mettre à jour les statistiques avec les données des tâches
        $taskTotalPaid = floatval($taskStats->total_paid ?? 0);
        $taskPendingAmount = floatval($taskStats->pending_amount ?? 0);
        $taskTotalPayments = intval($taskStats->total_payments ?? 0);
        $taskPendingPayments = intval($taskStats->pending_payments ?? 0);
        
        // Ajouter les statistiques des tâches aux statistiques globales
        $stats['total_earned'] += $taskTotalPaid;
        $stats['pending_amount'] += $taskPendingAmount;
        $stats['total_payments'] += $taskTotalPayments;
        $stats['pending_payments'] += $taskPendingPayments;
        
        // Journalisation des statistiques finales
        \Log::debug('Statistiques finales', [
            'task_total_paid' => $taskTotalPaid,
            'task_pending_amount' => $taskPendingAmount,
            'task_total_payments' => $taskTotalPayments,
            'task_pending_payments' => $taskPendingPayments,
            'final_stats' => $stats
        ]);
        
        // Récupérer les dernières rémunérations (depuis les deux tables)
        $recentRemunerations = collect();
        
        // 1. Récupérer les rémunérations standards
        $recentStandardPayments = Remuneration::with(['task', 'user'])
            ->when(!$isAdmin, function($q) use ($user) {
                return $q->where('user_id', $user->id);
            })
            ->latest()
            ->limit(5)
            ->get()
            ->map(function($remuneration) use ($user) {
                return [
                    'id' => $remuneration->id,
                    'type' => 'remuneration',
                    'amount' => $remuneration->amount,
                    'status' => $remuneration->status,
                    'created_at' => $remuneration->created_at,
                    'task' => $remuneration->task,
                    'user' => $remuneration->user,
                    'can' => [
                        'view' => $user->can('view', $remuneration),
                        'update' => $user->can('update', $remuneration),
                        'delete' => $user->can('delete', $remuneration),
                    ],
                ];
            });
            
        // 2. Récupérer les paiements de tâches récents
        $recentTaskPayments = \DB::table('task_payments')
            ->join('tasks', 'task_payments.task_id', '=', 'tasks.id')
            ->join('users', 'task_payments.user_id', '=', 'users.id')
            ->select(
                'task_payments.id',
                'task_payments.status',
                'task_payments.created_at',
                'task_payments.updated_at',
                'tasks.title as task_title',
                'tasks.amount',
                'users.name as user_name',
                'users.id as user_id'
            )
            ->when(!$isAdmin, function($q) use ($user) {
                return $q->where('task_payments.user_id', $user->id);
            })
            ->orderBy('task_payments.created_at', 'desc')
            ->limit(5)
            ->get()
            ->map(function($payment) use ($user) {
                return [
                    'id' => 'task_' . $payment->id,
                    'type' => 'task_payment',
                    'amount' => $payment->amount,
                    'status' => $payment->status,
                    'created_at' => $payment->created_at,
                    'task' => ['title' => $payment->task_title],
                    'user' => ['name' => $payment->user_name, 'id' => $payment->user_id],
                    'can' => [
                        'view' => true,
                        'update' => $user->isAdmin(),
                        'delete' => $user->isAdmin(),
                    ],
                ];
            });
            
        // Fusionner et trier par date
        $recentRemunerations = $recentStandardPayments
            ->concat($recentTaskPayments)
            ->sortByDesc('created_at')
            ->take(5);
        
        // Statistiques des tâches complétées
        $completedTasksQuery = \App\Models\Task::query();
        
        if (!$isAdmin) {
            $completedTasksQuery->where('assigned_to', $user->id);
        }
        
        // Compter les tâches terminées (statut 'done')
        $stats['completed_tasks'] = $completedTasksQuery->where('status', 'done')
            ->count();
            
        // Ajouter les statistiques des tâches en cours
        $stats['in_progress_tasks'] = $completedTasksQuery->newQuery()
            ->when(!$isAdmin, function($q) use ($user) {
                return $q->where('assigned_to', $user->id);
            })
            ->where('status', 'in_progress')
            ->count();
            
        // Ajouter les tâches à faire
        $stats['todo_tasks'] = $completedTasksQuery->newQuery()
            ->when(!$isAdmin, function($q) use ($user) {
                return $q->where('assigned_to', $user->id);
            })
            ->where('status', 'todo')
            ->count();
            
        // Log pour le débogage
        \Log::debug('Statistiques des tâches', [
            'user_id' => $user->id,
            'is_admin' => $isAdmin,
            'completed_tasks' => $stats['completed_tasks'],
            'in_progress_tasks' => $stats['in_progress_tasks'],
            'todo_tasks' => $stats['todo_tasks'],
            'sql' => [
                'completed' => $completedTasksQuery->toSql(),
                'in_progress' => $completedTasksQuery->getQuery()->toSql(),
                'todo' => $completedTasksQuery->getQuery()->toSql()
            ]
        ]);
            
        // Statistiques des bonus
        $stats['bonuses'] = \App\Models\Remuneration::where('type', 'bonus')
            ->when(!$isAdmin, function($q) use ($user) {
                return $q->where('user_id', $user->id);
            })
            ->where('status', 'paid')
            ->count();
            
        // Statistiques pour les administrateurs
        if ($isAdmin) {
            $stats['active_users'] = \App\Models\User::whereHas('taskPayments')->count();
            $stats['user_count'] = \App\Models\User::count();
            
            // Total des paiements en attente pour l'admin
            $stats['pending_payments'] = \App\Models\TaskPayment::where('task_payments.status', 'pending')
                ->join('tasks', 'task_payments.task_id', '=', 'tasks.id')
                ->sum('tasks.amount');
        } else {
            // Statistiques spécifiques à l'utilisateur
            $stats['active_users'] = null;
            $stats['user_count'] = null;
            
            // Paiements en attente pour l'utilisateur
            $stats['pending_payments'] = \App\Models\TaskPayment::where('task_payments.user_id', $user->id)
                ->where('task_payments.status', 'pending')
                ->join('tasks', 'task_payments.task_id', '=', 'tasks.id')
                ->sum('tasks.amount');
        }
        
        return Inertia::render('Remunerations/Dashboard', [
            'stats' => $stats,
            'recentRemunerations' => $recentRemunerations->values(),
            'isAdmin' => $isAdmin,
        ]);
    }

    /**
     * Affiche les détails d'une rémunération
     */
    public function show(Remuneration $remuneration)
    {
        $remuneration->load(['task', 'user', 'approver']);
        
        return Inertia::render('Remunerations/Show', [
            'remuneration' => $remuneration,
        ]);
    }

    /**
     * Marque une rémunération comme payée (admin uniquement)
     */
    public function markAsPaid(Remuneration $remuneration, Request $request)
    {
        $this->authorize('markAsPaid', $remuneration);
        
        $validated = $request->validate([
            'payment_method' => 'required|string|max:50',
            'transaction_reference' => 'nullable|string|max:100',
            'notes' => 'nullable|string',
        ]);

        try {
            // Start database transaction
            \DB::beginTransaction();
            
            $remuneration->update([
                'status' => 'paid',
                'payment_date' => now(),
                'payment_method' => $validated['payment_method'],
                'transaction_reference' => $validated['transaction_reference'] ?? null,
                'notes' => $validated['notes'] ?? $remuneration->notes,
                'paid_at' => now(),
                'paid_by' => auth()->id(),
            ]);
            
            // Log the payment
            activity()
                ->performedOn($remuneration)
                ->causedBy(auth()->user())
                ->withProperties([
                    'payment_method' => $validated['payment_method'],
                    'reference' => $validated['transaction_reference'] ?? null,
                    'amount' => $remuneration->amount,
                ])
                ->log('marked_as_paid');
            
            \DB::commit();
            
            return redirect()->back()->with('success', 'La rémunération a été marquée comme payée avec succès.');
            
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Erreur lors du paiement de la rémunération: ' . $e->getMessage(), [
                'remuneration_id' => $remuneration->id,
                'user_id' => auth()->id(),
                'exception' => $e
            ]);
            
            return redirect()->back()->with('error', 'Une erreur est survenue lors du traitement du paiement. Veuillez réessayer.');
        }
    }

    /**
     * Annule une rémunération (admin uniquement)
     */
    public function cancel(Remuneration $remuneration, Request $request)
    {
        $this->authorize('cancel', $remuneration);
        
        $validated = $request->validate([
            'reason' => 'required|string|max:500',
        ]);

        try {
            // Start database transaction
            \DB::beginTransaction();
            
            $remuneration->update([
                'status' => 'cancelled',
                'notes' => $validated['reason'],
                'approved_by' => auth()->id(),
                'approved_at' => now(),
            ]);
            
            // Log the cancellation
            activity()
                ->performedOn($remuneration)
                ->causedBy(auth()->user())
                ->withProperties([
                    'reason' => $validated['reason'],
                    'previous_status' => $remuneration->getOriginal('status'),
                ])
                ->log('cancelled');
            
            \DB::commit();
            
            return redirect()->back()->with('success', 'La rémunération a été annulée avec succès.');
            
        } catch (\Exception $e) {
            \DB::rollBack();
            \Log::error('Erreur lors de l\'annulation de la rémunération: ' . $e->getMessage(), [
                'remuneration_id' => $remuneration->id,
                'user_id' => auth()->id(),
                'exception' => $e
            ]);
            
            return redirect()->back()->with('error', 'Une erreur est survenue lors de l\'annulation de la rémunération. Veuillez réessayer.');
        }
    }
    
    /**
     * Récupère les statistiques de rémunération pour un utilisateur
     * Si $userId est null, récupère les statistiques globales (admin uniquement)
     */
    protected function getUserRemunerationStats($userId = null)
    {
        $stats = [
            'total_earned' => 0,
            'pending_amount' => 0,
            'cancelled_amount' => 0,
            'completed_tasks' => 0,
            'bonuses' => 0,
            'total_count' => 0,
            'total_payments' => 0,
            'pending_payments' => 0,
            'average_payment' => 0
        ];
        
        try {
            // 1. Récupérer les statistiques des rémunérations standards
            $remunerationQuery = Remuneration::query();
            
            // Filtrer par utilisateur si spécifié
            if ($userId !== null) {
                $remunerationQuery->where('user_id', $userId);
            }
            
            $remunerationStats = $remunerationQuery->select(
                \DB::raw('COALESCE(SUM(CASE WHEN status = "paid" THEN amount ELSE 0 END), 0) as total_paid'),
                \DB::raw('COALESCE(SUM(CASE WHEN status = "pending" THEN amount ELSE 0 END), 0) as pending_amount'),
                \DB::raw('COALESCE(SUM(CASE WHEN status = "cancelled" THEN amount ELSE 0 END), 0) as cancelled_amount'),
                \DB::raw('COUNT(*) as total_count'),
                \DB::raw('SUM(CASE WHEN status = "pending" THEN 1 ELSE 0 END) as pending_count'),
                \DB::raw('SUM(CASE WHEN type = "task_completion" THEN 1 ELSE 0 END) as completed_tasks'),
                \DB::raw('SUM(CASE WHEN type = "bonus" THEN 1 ELSE 0 END) as bonuses')
            )->first();
            
            // Mettre à jour les statistiques avec les données des rémunérations standards
            if ($remunerationStats) {
                $stats['total_earned'] = floatval($remunerationStats->total_paid ?? 0);
                $stats['pending_amount'] = floatval($remunerationStats->pending_amount ?? 0);
                $stats['cancelled_amount'] = floatval($remunerationStats->cancelled_amount ?? 0);
                $stats['completed_tasks'] = intval($remunerationStats->completed_tasks ?? 0);
                $stats['bonuses'] = intval($remunerationStats->bonuses ?? 0);
                $stats['total_count'] = intval($remunerationStats->total_count ?? 0);
                $stats['total_payments'] = intval($remunerationStats->total_count ?? 0);
                $stats['pending_payments'] = intval($remunerationStats->pending_count ?? 0);
                
                // Calculer la moyenne des paiements
                if ($stats['total_payments'] > 0) {
                    $stats['average_payment'] = $stats['total_earned'] / $stats['total_payments'];
                }
            }
            
            // 2. Récupérer les statistiques des tâches payées
            $taskPaymentQuery = \DB::table('task_payments')
                ->join('tasks', 'task_payments.task_id', '=', 'tasks.id')
                ->select(
                    \DB::raw('COALESCE(SUM(CASE WHEN task_payments.status = "completed" THEN tasks.amount ELSE 0 END), 0) as total_paid'),
                    \DB::raw('COUNT(DISTINCT task_payments.id) as total_payments'),
                    \DB::raw('COALESCE(SUM(CASE WHEN task_payments.status = "pending" THEN tasks.amount ELSE 0 END), 0) as pending_amount'),
                    \DB::raw('COUNT(DISTINCT CASE WHEN task_payments.status = "pending" THEN task_payments.id END) as pending_payments')
                );
                
            if ($userId !== null) {
                $taskPaymentQuery->where('task_payments.user_id', $userId);
            }
            
            $taskStats = $taskPaymentQuery->first();
            
            // Mettre à jour les statistiques avec les données des tâches
            if ($taskStats) {
                $stats['total_earned'] += floatval($taskStats->total_paid ?? 0);
                $stats['pending_amount'] += floatval($taskStats->pending_amount ?? 0);
                $stats['total_payments'] += intval($taskStats->total_payments ?? 0);
                $stats['pending_payments'] += intval($taskStats->pending_payments ?? 0);
                
                // Recalculer la moyenne avec les nouvelles données
                if ($stats['total_payments'] > 0) {
                    $stats['average_payment'] = $stats['total_earned'] / $stats['total_payments'];
                }
            }
            
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la récupération des statistiques de rémunération: ' . $e->getMessage(), [
                'user_id' => $userId,
                'exception' => $e
            ]);
        }
        
        return $stats;
    }
    
    /**
     * Retourne le libellé lisible d'un type de rémunération
     */
    protected function getTypeLabel($type)
    {
        $types = [
            'task' => 'Tâche',
            'bonus' => 'Bonus',
            'refund' => 'Remboursement',
            'other' => 'Autre',
        ];
        
        return $types[$type] ?? $type;
    }
    
    /**
     * Retourne le libellé lisible d'un statut de rémunération
     */
    protected function getStatusLabel($status)
    {
        $statuses = [
            'pending' => 'En attente',
            'paid' => 'Payé',
            'cancelled' => 'Annulé',
        ];
        
        return $statuses[$status] ?? $status;
    }
}

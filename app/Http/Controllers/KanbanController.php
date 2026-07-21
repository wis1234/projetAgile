<?php

namespace App\Http\Controllers;

use App\Models\Task;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Illuminate\Support\Facades\Auth;

class KanbanController extends Controller
{
    /**
     * Affiche le tableau Kanban
     */
    public function index()
    {
        $user = Auth::user();
        
        // Vérifier si l'utilisateur est authentifié
        if (!$user) {
            return redirect()->route('login');
        }

        $this->authorize('viewAny', Task::class);

        $query = Task::with(['assignedUser', 'project'])
            ->orderBy('position')
            ->orderBy('updated_at', 'desc');

        if (!$user->hasRole('admin')) {
            // Pour les non-admins, ne montrer que les tâches des projets auxquels ils appartiennent
            $projectIds = $user->projects()->wherePivot('is_muted', false)->pluck('projects.id');
            $query->whereIn('project_id', $projectIds);
        }

       // $tasks = $query->get();
       $tasks = $query->get()->map(function ($task) use ($user) {
    $task->can_update = $user->can('update', $task);
    return $task;
});

        // Récupérer toutes les informations nécessaires pour l'utilisateur
        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'profile_photo_url' => $user->profile_photo_url ?? null,
            'is_admin' => $user->hasRole('admin'),
            'is_manager' => $user->hasRole('manager')
        ];

        return Inertia::render('Kanban/Index', [
            'tasks' => $tasks,
            'auth' => [
                'user' => $userData
            ],
            'title' => 'Suivi des tâches'
        ]);
    }

    /**
     * Met à jour l'ordre et le statut des tâches
     */
/**
 * Met à jour l'ordre et le statut des tâches
 */
public function updateOrder(Request $request)
{
    // Journalisation des données brutes reçues
    $rawInput = $request->getContent();
    \Log::info('Données brutes reçues pour la mise à jour du Kanban', [
        'raw_input' => $rawInput,
        'content_type' => $request->header('Content-Type'),
        'accept' => $request->header('Accept'),
        'x_csrf_token' => $request->header('X-CSRF-TOKEN'),
        'ip' => $request->ip(),
        'user_agent' => $request->userAgent(),
        'user_id' => auth()->id(),
        'authenticated' => auth()->check()
    ]);

    // Journalisation des données parsées
    $jsonData = json_decode($rawInput, true);
    \Log::info('Données JSON décodées', [
        'json_data' => $jsonData,
        'json_last_error' => json_last_error(),
        'json_last_error_msg' => json_last_error_msg()
    ]);

    // Valider que nous avons des données JSON valides
    if (json_last_error() !== JSON_ERROR_NONE) {
        \Log::error('Erreur de décodage JSON', [
            'error' => json_last_error_msg(),
            'input' => $rawInput
        ]);
        return response()->json([
            'message' => 'Données JSON invalides',
            'error' => json_last_error_msg()
        ], 400);
    }

    // Valider la structure des données
    $validator = \Validator::make($jsonData, [
        'tasks' => 'required|array|min:1',
        'tasks.*.id' => [
            'required',
            'integer',
            Rule::exists('tasks', 'id')
        ],
        'tasks.*.status' => [
            'required',
            'string',
            Rule::in(['todo', 'in_progress', 'done'])
        ],
        'tasks.*.position' => 'required|integer', // Retrait de la validation min:0 pour permettre les positions négatives
    ]);

    if ($validator->fails()) {
        \Log::error('Erreur de validation pour la mise à jour du Kanban', [
            'errors' => $validator->errors(),
            'user_id' => auth()->id(),
        ]);
        return response()->json([
            'success' => false,
            'message' => 'Données invalides.',
            'errors' => $validator->errors(),
        ], 422);
    }

    $tasks = $request->input('tasks');
    $user = Auth::user();

    $updated = [];
    $skipped = [];

    try {
        DB::beginTransaction();

        // Mettre à jour chaque tâche avec les nouvelles valeurs
        foreach ($tasks as $taskData) {
            $task = Task::with('project')->findOrFail($taskData['id']);

            // Vérifier les autorisations : on ignore la tâche au lieu de tout annuler
            if (!$user->can('update', $task)) {
                $skipped[] = $task->id;
                Log::warning('Tâche ignorée (non autorisée)', [
                    'task_id' => $task->id,
                    'project_id' => $task->project_id,
                    'user_id' => $user->id,
                ]);
                continue; // passe à la tâche suivante au lieu de throw
            }

            // Mettre à jour la tâche
            $task->update([
                'status' => $taskData['status'],
                'position' => (int) $taskData['position'],
            ]);

            $updated[] = $task->id;

            // Journalisation pour le débogage
            Log::info('Tâche mise à jour', [
                'task_id' => $task->id,
                'status' => $task->status,
                'position' => $task->position,
                'user_id' => $user->id,
            ]);
        }

        DB::commit();

        // Recharger uniquement les tâches réellement mises à jour
        $updatedTasks = Task::whereIn('id', $updated)
            ->with(['assignedUser', 'project'])
            ->orderBy('status')
            ->orderBy('position')
            ->orderBy('updated_at', 'desc')
            ->get();

        return response()->json([
            'success' => true,
            'message' => count($skipped) > 0
                ? 'Mise à jour effectuée, certaines tâches ont été ignorées (accès non autorisé).'
                : 'Le tableau Kanban a été mis à jour avec succès.',
            'data' => $updatedTasks,
            'skipped_task_ids' => $skipped,
        ]);

    } catch (\Exception $e) {
        DB::rollBack();

        Log::error('Erreur lors de la mise à jour du Kanban', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
            'user_id' => $user->id ?? null,
        ]);

        return response()->json([
            'success' => false,
            'message' => 'Une erreur est survenue lors de la mise à jour du tableau Kanban.',
            'error' => config('app.debug') ? $e->getMessage() : null,
        ], 500);
    }
}

    /**
     * Récupère les tâches pour l'API
     */
    public function apiTasks()
    {
        $this->authorize('viewAny', Task::class);

        $user = Auth::user();
        
        // Créer une requête de base avec les relations nécessaires
        $query = Task::with(['assignedUser', 'project'])
            ->select('*')
            ->orderBy('status') // D'abord trier par statut
            ->orderBy('position', 'asc') // Puis par position
            ->orderBy('updated_at', 'desc'); // Enfin par date de mise à jour

        // Filtrer par projets auxquels l'utilisateur a accès
        if (!$user->hasRole('admin')) {
            $projectIds = $user->projects()->wherePivot('is_muted', false)->pluck('projects.id');
            $query->whereIn('project_id', $projectIds);
        }

        // Récupérer les tâches
        //$tasks = $query->get();
        $tasks = $query->get()->map(function ($task) use ($user) {
    $task->can_update = $user->can('update', $task);
    return $task;
});

        // Journalisation pour le débogage
        \Log::info('Tâches chargées pour le Kanban', [
            'count' => $tasks->count(),
            'user_id' => $user->id,
            'is_admin' => $user->hasRole('admin')
        ]);

        return response()->json([
            'success' => true,
            'data' => $tasks,
        ]);
    }
}

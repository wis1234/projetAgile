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
        $this->authorize('viewAny', Task::class);

        $user = Auth::user();
        $query = Task::with(['assignedUser', 'project'])
            ->orderBy('position')
            ->orderBy('updated_at', 'desc');

        if (!$user->hasRole('admin')) {
            // Pour les non-admins, ne montrer que les tâches des projets où l'utilisateur est manager
            $projectIds = $user->managedProjects()->pluck('id');
            $query->whereIn('project_id', $projectIds);
        }

        $tasks = $query->get();

        return Inertia::render('Kanban/Index', [
            'tasks' => $tasks,
        ]);
    }

    /**
     * Met à jour l'ordre et le statut des tâches
     */
    public function updateOrder(Request $request)
    {
        $request->validate([
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
            'tasks.*.position' => 'required|integer|min:0',
        ]);

        $tasks = $request->input('tasks');
        $user = Auth::user();

        try {
            DB::beginTransaction();

            // Mettre à jour chaque tâche avec les nouvelles valeurs
            foreach ($tasks as $taskData) {
                $task = Task::findOrFail($taskData['id']);
                
                // Vérifier les autorisations
                if (!$user->can('update', $task)) {
                    throw new \Exception("Action non autorisée pour la tâche #{$task->id}");
                }

                // Mettre à jour la tâche
                $task->update([
                    'status' => $taskData['status'],
                    'position' => (int)$taskData['position'],
                ]);

                // Journalisation pour le débogage
                Log::info('Tâche mise à jour', [
                    'task_id' => $task->id,
                    'status' => $task->status,
                    'position' => $task->position,
                    'user_id' => $user->id,
                ]);
            }

            DB::commit();

            // Recharger les tâches mises à jour depuis la base de données
            $updatedTasks = Task::whereIn('id', array_column($tasks, 'id'))
                ->with(['assignedUser', 'project'])
                ->orderBy('status')
                ->orderBy('position')
                ->orderBy('updated_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'message' => 'Le tableau Kanban a été mis à jour avec succès.',
                'data' => $updatedTasks
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

        // Filtrer par projets gérés pour les non-admins
        if (!$user->hasRole('admin')) {
            $projectIds = $user->managedProjects()->pluck('id');
            $query->whereIn('project_id', $projectIds);
        }

        // Récupérer les tâches
        $tasks = $query->get();

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

<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class TaskPolicy
{
    /**
     * Check if the task is locked due to a finished sprint.
     * Only unfinished tasks belonging to an expired sprint are locked.
     */
    private function isLocked(Task $task): bool
    {
        // "toutes les tâches inachevees seront bloquées"
        if ($task->status === 'done') {
            return false;
        }

        if (!$task->sprint_id) {
            return false;
        }

        $task->loadMissing('sprint');

        if (!$task->sprint || !$task->sprint->end_date) {
            return false;
        }

        return Carbon::parse($task->sprint->end_date)->isPast();
    }

    /**
     * Check if the user is a manager of the project.
     */
 /**
     * Vérifie si l'utilisateur est manager du projet de la tâche.
     * 
     * @param User $user
     * @param Task $task
     * @return bool
     */
    private function isProjectManager(User $user, Task $task): bool
    {
        // 1. Charger la relation 'project' si elle n'est pas déjà chargée
        if (!$task->relationLoaded('project')) {
            $task->load('project');
        }

        // 2. Si la tâche n'a pas de projet, aucun manager possible
        if (!$task->project) {
            Log::warning('isProjectManager: project null', [
                'user_id'   => $user->id,
                'task_id'   => $task->id,
                'project_id'=> $task->project_id,
            ]);
            return false;
        }

        // 3. Vérifier dans la table pivot project_user
        //    Conditions : user_id = $user->id, role = 'manager', is_muted = 0
        $exists = $task->project->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'manager')
            ->wherePivot('is_muted', false)
            ->exists();

        // 4. Log détaillé pour déboguer
        Log::info('isProjectManager result', [
            'user_id'    => $user->id,
            'task_id'    => $task->id,
            'project_id' => $task->project_id,
            'project_name' => $task->project->name ?? 'N/A',
            'role'       => 'manager',
            'is_muted'   => 0,
            'is_manager' => $exists,
        ]);

        return $exists;
    }

    public function viewAny(User $user)
    {
        return $user->hasRole('admin') || $user->projects()->exists();
    }

    public function view(User $user, Task $task)
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $isLocked = $this->isLocked($task);
        $isManager = $this->isProjectManager($user, $task);

        // Si la tâche est verrouillée (sprint terminé et inachevée), seuls les managers peuvent y accéder (Show page)
        if ($isLocked && !$isManager) {
            return false;
        }

        if (!$task->project) {
            return false;
        }

        return $task->project->users()
            ->where('user_id', $user->id)
            ->wherePivot('is_muted', false)
            ->exists();
    }

    public function update(User $user, Task $task)
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $isLocked = $this->isLocked($task);
        $isManager = $this->isProjectManager($user, $task);

        // Seuls les managers peuvent modifier, même si c'est verrouillé (pour permettre de débloquer ou ajuster)
        // Mais si c'est verrouillé et que l'utilisateur n'est pas manager, on bloque.
        if ($isLocked && !$isManager) {
            return false;
        }

        return $isManager;
    }

    public function delete(User $user, Task $task)
    {
        return $this->update($user, $task);
    }

    public function comment(User $user, Task $task)
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($this->isLocked($task) && !$this->isProjectManager($user, $task)) {
            return false;
        }

        if (!$task->project) {
            return false;
        }

        $projectUser = $task->project->users()->where('user_id', $user->id)->first();

        if (!$projectUser || $projectUser->pivot->is_muted) {
            return false;
        }

        return $projectUser->pivot->role === 'manager' || $task->assigned_to === $user->id;
    }

    public function create(User $user)
    {
        return $user !== null;
    }

    public function uploadFile(User $user, Task $task)
    {
        return $this->comment($user, $task);
    }

    public function validatePayment(User $user, Task $task)
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $this->isProjectManager($user, $task);
    }
}

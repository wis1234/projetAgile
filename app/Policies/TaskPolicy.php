<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;

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
private function isProjectManager(User $user, Task $task): bool
{
    if (!$task->project) {
        return false;
    }

    // Vérifie si l'utilisateur est manager dans la pivot
    return $task->project->users()
        ->where('user_id', $user->id)
        ->wherePivotIn('role', ['manager', 'project_manager']) // Accepte les deux valeurs
        ->wherePivot('is_muted', false)
        ->exists();
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

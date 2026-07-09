<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;

class TaskPolicy
{
    /**
     * Check if the task is locked due to a finished sprint.
     */
    private function isLocked(Task $task): bool
    {
        if (!$task->sprint_id) {
            return false;
        }

        $task->loadMissing('sprint');

        if (!$task->sprint) {
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

        return $task->project->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'manager')
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

        // Si la tâche est verrouillée (sprint terminé), seuls les managers peuvent y accéder
        if ($isLocked) {
            return $isManager;
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

        // Si verrouillée, seul l'admin peut modifier (ou manager si on veut, mais la demande dit bloqué jusqu'à ce que le sprint soit prolongé)
        // La demande dit : "bloque les page show edit ... sauf les manager". Donc les managers gardent l'accès.
        if ($isLocked) {
            return $isManager;
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

        if ($this->isLocked($task)) {
            return $this->isProjectManager($user, $task);
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

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

    public function viewAny(User $user)
    {
        return $user->hasRole('admin') || $user->projects()->exists();
    }

    public function view(User $user, Task $task)
    {
        if ($user->hasRole('admin')) {
            return true;
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
        if ($this->isLocked($task) && !$user->hasRole('admin')) {
            return false;
        }

        if ($user->hasRole('admin')) {
            return true;
        }

        if (!$task->project) {
            return false;
        }

        return $task->project->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'manager')
            ->wherePivot('is_muted', false)
            ->exists();
    }

    public function delete(User $user, Task $task)
    {
        if ($this->isLocked($task) && !$user->hasRole('admin')) {
            return false;
        }

        return $this->update($user, $task);
    }

    public function comment(User $user, Task $task)
    {
        if ($this->isLocked($task) && !$user->hasRole('admin')) {
            return false;
        }

        if ($user->hasRole('admin')) {
            return true;
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

        if (!$task->project) {
            return false;
        }

        return $task->project->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'manager')
            ->wherePivot('is_muted', false)
            ->exists();
    }
}

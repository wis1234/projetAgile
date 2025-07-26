<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;

class TaskPolicy
{
    public function viewAny(User $user)
    {
        return $user->hasRole('admin') || $user->projects()->exists();
    }

    public function view(User $user, Task $task)
    {
        return $user->hasRole('admin')
            || ($task->project && $task->project->users()->where('user_id', $user->id)->exists());
    }

    public function update(User $user, Task $task)
    {
        return $user->hasRole('admin')
            || ($task->project && $task->project->users()->where('user_id', $user->id)->wherePivot('role', 'manager')->exists());
    }

    public function delete(User $user, Task $task)
    {
        return $this->update($user, $task);
    }

    public function comment(User $user, Task $task)
    {
        return $user->hasRole('admin')
            || ($task->project && $task->project->users()->where('user_id', $user->id)->wherePivot('role', 'manager')->exists())
            || $task->assigned_to == $user->id;
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
        return $user->hasRole('admin')
            || ($task->project && $task->project->users()->where('user_id', $user->id)->wherePivot('role', 'manager')->exists());
    }
} 
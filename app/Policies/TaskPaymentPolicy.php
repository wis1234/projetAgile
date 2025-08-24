<?php

namespace App\Policies;

use App\Models\TaskPayment;
use App\Models\User;

class TaskPaymentPolicy
{
    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, TaskPayment $taskPayment)
    {
        if (is_user_muted_in_project($user, $taskPayment->task->project)) {
            return false;
        }
        return $user->hasRole('admin') || ($taskPayment->task->project && $taskPayment->task->project->users()->where('user_id', $user->id)->exists());
    }

    public function create(User $user, $task)
    {
        if (is_user_muted_in_project($user, $task->project)) {
            return false;
        }
        return $user->hasRole('admin') || ($task->project && $task->project->users()->where('user_id', $user->id)->exists());
    }

    public function update(User $user, TaskPayment $taskPayment)
    {
        if (is_user_muted_in_project($user, $taskPayment->task->project)) {
            return false;
        }
        return $user->hasRole('admin') || ($taskPayment->task->project && $taskPayment->task->project->users()->where('user_id', $user->id)->wherePivot('role', 'manager')->exists());
    }

    public function delete(User $user, TaskPayment $taskPayment)
    {
        if (is_user_muted_in_project($user, $taskPayment->task->project)) {
            return false;
        }
        return $user->hasRole('admin') || ($taskPayment->task->project && $taskPayment->task->project->users()->where('user_id', $user->id)->wherePivot('role', 'manager')->exists());
    }
}

<?php

namespace App\Policies;

use App\Models\TaskComment;
use App\Models\User;

class TaskCommentPolicy
{
    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, TaskComment $taskComment)
    {
        if (is_user_muted_in_project($user, $taskComment->task->project)) {
            return false;
        }
        return $user->hasRole('admin') || ($taskComment->task->project && $taskComment->task->project->users()->where('user_id', $user->id)->exists());
    }

    public function create(User $user, $task)
    {
        if (is_user_muted_in_project($user, $task->project)) {
            return false;
        }
        return $user->hasRole('admin') || ($task->project && $task->project->users()->where('user_id', $user->id)->exists());
    }

    public function update(User $user, TaskComment $taskComment)
    {
        if (is_user_muted_in_project($user, $taskComment->task->project)) {
            return false;
        }
        return $user->hasRole('admin') || $user->id === $taskComment->user_id;
    }

    public function delete(User $user, TaskComment $taskComment)
    {
        if (is_user_muted_in_project($user, $taskComment->task->project)) {
            return false;
        }
        return $user->hasRole('admin') || $user->id === $taskComment->user_id;
    }
}

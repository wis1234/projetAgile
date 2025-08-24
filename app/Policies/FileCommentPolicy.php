<?php

namespace App\Policies;

use App\Models\FileComment;
use App\Models\User;

class FileCommentPolicy
{
    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, FileComment $fileComment)
    {
        if (is_user_muted_in_project($user, $fileComment->file->project)) {
            return false;
        }
        return $user->hasRole('admin') || ($fileComment->file->project && $fileComment->file->project->users()->where('user_id', $user->id)->exists());
    }

    public function create(User $user, $file)
    {
        if (is_user_muted_in_project($user, $file->project)) {
            return false;
        }
        return $user->hasRole('admin') || ($file->project && $file->project->users()->where('user_id', $user->id)->exists());
    }

    public function update(User $user, FileComment $fileComment)
    {
        if (is_user_muted_in_project($user, $fileComment->file->project)) {
            return false;
        }
        return $user->hasRole('admin') || $user->id === $fileComment->user_id;
    }

    public function delete(User $user, FileComment $fileComment)
    {
        if (is_user_muted_in_project($user, $fileComment->file->project)) {
            return false;
        }
        return $user->hasRole('admin') || $user->id === $fileComment->user_id;
    }
}

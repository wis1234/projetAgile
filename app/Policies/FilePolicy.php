<?php

namespace App\Policies;

use App\Models\User;
use App\Models\File;
use Illuminate\Auth\Access\HandlesAuthorization;

class FilePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view files') || $user->hasRole('admin');
    }

    public function view(User $user, File $file): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $project = $file->project ?? ($file->task ? $file->task->project : null);

        if ($project) {
            return $project->users()
                ->where('user_id', $user->id)
                ->wherePivot('is_muted', false)
                ->exists();
        }

        return $user->id === $file->user_id;
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create files') || $user->hasRole('admin');
    }

    public function update(User $user, File $file): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $project = $file->project ?? ($file->task ? $file->task->project : null);

        if ($project) {
            $isNonMutedMember = $project->users()
                ->where('user_id', $user->id)
                ->wherePivot('is_muted', false)
                ->exists();

            if (!$isNonMutedMember) {
                return false;
            }
            
            return true; // As per original logic, any member can update
        }

        return $user->id === $file->user_id;
    }

    public function delete(User $user, File $file): bool
    {
        return $this->update($user, $file);
    }

    public function restore(User $user, File $file): bool
    {
        return $user->hasRole('admin');
    }

    public function forceDelete(User $user, File $file): bool
    {
        return $user->hasRole('admin');
    }
}
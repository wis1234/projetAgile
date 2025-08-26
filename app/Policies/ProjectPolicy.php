<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\User;

class ProjectPolicy
{
    public function viewAny(User $user)
    {
        return $user->hasRole('admin') || $user->projects()->exists();
    }

    public function view(User $user, Project $project)
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('is_muted', false)
            ->exists();
    }

    public function create(User $user)
    {
        return $user->hasRole('admin') || $user->hasRole('manager');
    }

    public function update(User $user, Project $project)
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'manager')
            ->wherePivot('is_muted', false)
            ->exists();
    }

    public function delete(User $user, Project $project)
    {
        return $user->hasRole('admin');
    }

    public function manageMembers(User $user, Project $project)
    {
        if ($user->hasRole('admin')) {
            return true;
        }
        
        return $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'manager')
            ->wherePivot('is_muted', false)
            ->exists();
    }
}
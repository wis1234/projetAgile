<?php

namespace App\Policies;

use App\Models\Sprint;
use App\Models\User;

class SprintPolicy
{
    public function viewAny(User $user)
    {
        return $user->hasRole('admin') || $user->projects()->exists();
    }

    public function view(User $user, Sprint $sprint)
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if (!$sprint->project) {
            return false;
        }

        return $sprint->project->users()
            ->where('user_id', $user->id)
            ->wherePivot('is_muted', false)
            ->exists();
    }

    public function create(User $user)
    {
        return $user->hasRole('admin') || $user->hasRole('manager');
    }

    public function update(User $user, Sprint $sprint)
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if (!$sprint->project) {
            return false;
        }

        return $sprint->project->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'manager')
            ->wherePivot('is_muted', false)
            ->exists();
    }

    public function delete(User $user, Sprint $sprint)
    {
        return $this->update($user, $sprint);
    }
}
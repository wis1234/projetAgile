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
        return $user->hasRole('admin') || ($sprint->project && $sprint->project->users()->where('user_id', $user->id)->exists());
    }

    public function create(User $user)
    {
        return $user->hasRole('admin') || $user->hasRole('manager');
    }

    public function update(User $user, Sprint $sprint)
    {
        return $user->hasRole('admin') || ($sprint->project && $sprint->project->users()->where('user_id', $user->id)->wherePivot('role', 'manager')->exists());
    }

    public function delete(User $user, Sprint $sprint)
    {
        return $this->update($user, $sprint);
    }
} 
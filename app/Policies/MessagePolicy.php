<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\Project;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class MessagePolicy
{
    use HandlesAuthorization;

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Message $message)
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if (!$message->project) {
            return true; // Or handle as per your app's logic for global messages
        }

        return $message->project->users()
            ->where('user_id', $user->id)
            ->wherePivot('is_muted', false)
            ->exists();
    }

    public function create(User $user, Project $project)
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('is_muted', false)
            ->exists();
    }

    public function update(User $user, Message $message)
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($user->id !== $message->user_id) {
            return false;
        }

        if (!$message->project) {
            return true; // Owner can edit their global messages
        }

        return $message->project->users()
            ->where('user_id', $user->id)
            ->wherePivot('is_muted', false)
            ->exists();
    }

    public function delete(User $user, Message $message)
    {
        return $this->update($user, $message);
    }
}

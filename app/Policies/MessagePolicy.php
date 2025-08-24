<?php

namespace App\Policies;

use App\Models\Message;
use App\Models\User;

class MessagePolicy
{
    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, Message $message)
    {
        if (is_user_muted_in_project($user, $message->project)) {
            return false;
        }
        return $user->hasRole('admin') || ($message->project && $message->project->users()->where('user_id', $user->id)->exists());
    }

    public function create(User $user)
    {
        return true;
    }

    public function update(User $user, Message $message)
    {
        if (is_user_muted_in_project($user, $message->project)) {
            return false;
        }
        return $user->hasRole('admin') || $user->id === $message->user_id;
    }

    public function delete(User $user, Message $message)
    {
        if (is_user_muted_in_project($user, $message->project)) {
            return false;
        }
        return $user->hasRole('admin') || $user->id === $message->user_id;
    }
}

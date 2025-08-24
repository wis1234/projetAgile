<?php

namespace App\Policies;

use App\Models\AuditLog;
use App\Models\User;

class AuditLogPolicy
{
    public function viewAny(User $user)
    {
        return $user->hasRole('admin');
    }

    public function view(User $user, AuditLog $auditLog)
    {
        if (is_user_muted_in_project($user, $auditLog->project)) {
            return false;
        }
        return $user->hasRole('admin') || ($auditLog->project && $auditLog->project->users()->where('user_id', $user->id)->exists());
    }

    public function create(User $user)
    {
        return false;
    }

    public function update(User $user, AuditLog $auditLog)
    {
        return false;
    }

    public function delete(User $user, AuditLog $auditLog)
    {
        return false;
    }
}

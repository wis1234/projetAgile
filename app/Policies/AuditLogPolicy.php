<?php

namespace App\Policies;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class AuditLogPolicy
{
    use HandlesAuthorization;

    public function before(User $user, $ability)
    {
        if ($user->hasRole('admin')) {
            return true;
        }
    }

    public function viewAny(User $user)
    {
        return true;
    }

    public function view(User $user, AuditLog $auditLog)
    {
        if (!$auditLog->project) {
            return false;
        }

        return $auditLog->project->users()
            ->where('user_id', $user->id)
            ->wherePivot('is_muted', false)
            ->exists();
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

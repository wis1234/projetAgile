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



//file view older place




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
    
public function view(User $user, File $file): bool
{
    // Admin global → toujours accès
    if ($user->hasRole('admin')) {
        return true;
    }

    // Propriétaire du fichier → accès
    if ($file->user_id === $user->id) {
        return true;
    }

    // Membre du projet lié au fichier (non muet) → accès
    $project = $file->project ?? ($file->task?->project ?? null);
    if ($project) {
        $isMember = $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('is_muted', false)
            ->exists();
        if ($isMember) {
            return true;
        }
    }

    // Accès explicite via file_accesses
    return $file->canUser($user, 'view');
}


    public function comment(User $user, File $file): bool
    {
        return $file->canUser($user, 'comment');
    }

    public function update_colab(User $user, File $file): bool
    {
        return $file->canUser($user, 'edit');
    }

    public function manageAccess(User $user, File $file): bool
    {
        return $file->canUser($user, 'admin');
    }

    public function viewHistory(User $user, File $file): bool
    {
        return $file->canUser($user, 'view');
    }

    public function restoreVersion(User $user, File $file): bool
    {
        return $file->canUser($user, 'admin');
    }

    public function delete_colab(User $user, File $file): bool
    {
        return $file->canUser($user, 'admin');
    }



}
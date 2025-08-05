<?php

namespace App\Policies;

use App\Models\User;
use App\Models\File;
use Illuminate\Auth\Access\HandlesAuthorization;

class FilePolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('view files') || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, File $file): bool
    {
        // Les administrateurs peuvent tout voir
        if ($user->hasRole('admin')) {
            return true;
        }

        // L'utilisateur qui a créé le fichier peut le voir
        if ($user->id === $file->user_id) {
            return true;
        }

        // Les membres du projet peuvent voir les fichiers du projet
        if ($file->project && $file->project->users->contains('id', $user->id)) {
            return true;
        }

        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create files') || $user->hasRole('admin');
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, File $file): bool
    {
        // Les administrateurs peuvent tout modifier
        if ($user->hasRole('admin')) {
            return true;
        }

        // L'utilisateur qui a créé le fichier peut le modifier
        if ($user->id === $file->user_id) {
            return true;
        }

        // Les managers du projet peuvent modifier les fichiers du projet
        if ($file->project) {
            $projectUser = $file->project->users()->where('user_id', $user->id)->first();
            if ($projectUser && $projectUser->pivot->role === 'manager') {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, File $file): bool
    {
        // Mêmes règles que pour la mise à jour
        return $this->update($user, $file);
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, File $file): bool
    {
        return $user->hasRole('admin');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, File $file): bool
    {
        return $user->hasRole('admin');
    }
}

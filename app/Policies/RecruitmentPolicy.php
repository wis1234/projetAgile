<?php

namespace App\Policies;

use App\Models\Recruitment;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class RecruitmentPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return $user->can('view any recruitment');
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Recruitment $recruitment): bool
    {
        // Tous les utilisateurs authentifiés peuvent voir les offres publiées
        if ($recruitment->status === 'published') {
            return true;
        }
        
        // Les administrateurs et les managers peuvent voir toutes les offres
        if ($user->hasRole(['admin', 'manager'])) {
            return true;
        }
        
        // L'auteur de l'offre peut la voir même si elle n'est pas publiée
        if ($user->id === $recruitment->created_by) {
            return true;
        }
        
        return false;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {
        return $user->hasRole(['admin', 'manager']);
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, Recruitment $recruitment): bool
    {
        // L'administrateur peut tout modifier
        if ($user->hasRole('admin')) {
            return true;
        }
        
        // Le manager peut modifier ses propres offres
        if ($user->hasRole('manager') && $user->id === $recruitment->created_by) {
            return true;
        }
        
        // Vérification des permissions spécifiques si définies
        return $user->can('edit recruitment') || 
               ($user->id === $recruitment->created_by && $user->can('edit own recruitment'));
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Recruitment $recruitment): bool
    {
        return $user->can('delete recruitment') || 
               ($user->id === $recruitment->created_by && $user->can('delete own recruitment'));
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, Recruitment $recruitment): bool
    {
        return $user->can('restore recruitment');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, Recruitment $recruitment): bool
    {
        return $user->can('force delete recruitment');
    }

    /**
     * Determine whether the user can apply to the recruitment.
     */
    public function apply(User $user, Recruitment $recruitment): bool
    {
        // Vérifier si l'utilisateur est authentifié
        if (!$user) {
            return false;
        }
        
        // Vérifier si l'offre est publiée
        if ($recruitment->status !== 'published') {
            return false;
        }
        
        // Vérifier si l'utilisateur n'a pas déjà postulé
        if ($recruitment->applications()->where('user_id', $user->id)->exists()) {
            return false;
        }
        
        // Tous les utilisateurs authentifiés peuvent postuler
        return true;
    }

    /**
     * Determine whether the user can view applications.
     */
    public function viewApplications(User $user, Recruitment $recruitment): bool
    {
        return $user->can('view recruitment applications') || 
               $user->id === $recruitment->created_by;
    }

    /**
     * Determine whether the user can manage applications.
     */
    public function manageApplications(User $user, Recruitment $recruitment): bool
    {
        return $user->can('manage recruitment applications') || 
               $user->id === $recruitment->created_by;
    }
}

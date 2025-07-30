<?php

namespace App\Policies;

use App\Models\User;
use App\Models\School;
use Illuminate\Auth\Access\HandlesAuthorization;

class SchoolPolicy
{
    use HandlesAuthorization;

    /**
     * Détermine si l'utilisateur peut voir n'importe quel modèle.
     */
    public function viewAny(User $user): bool
    {
        // Tous les utilisateurs authentifiés peuvent voir la liste des écoles
        return true;
    }

    /**
     * Détermine si l'utilisateur peut voir le modèle spécifique.
     */
    public function view(User $user, School $school): bool
    {
        // Les administrateurs peuvent tout voir
        if ($user->hasRole('admin')) {
            return true;
        }

        // Les administrateurs d'école ne peuvent voir que leur école
        if ($user->isSchoolAdmin()) {
            return $user->school_id === $school->id;
        }

        // Par défaut, on refuse l'accès
        return false;
    }

    /**
     * Détermine si l'utilisateur peut créer des modèles.
     */
    public function create(User $user): bool
    {
        // Seuls les administrateurs peuvent créer des écoles
        return $user->hasRole('admin');
    }

    /**
     * Détermine si l'utilisateur peut mettre à jour le modèle.
     */
    public function update(User $user, School $school): bool
    {
        // Les administrateurs peuvent tout mettre à jour
        if ($user->hasRole('admin')) {
            return true;
        }

        // Les administrateurs d'école peuvent mettre à jour leur école
        if ($user->isSchoolAdmin() && $user->school_id === $school->id) {
            return true;
        }

        return false;
    }

    /**
     * Détermine si l'utilisateur peut supprimer le modèle.
     */
    public function delete(User $user, School $school): bool
    {
        // Seuls les administrateurs peuvent supprimer des écoles
        // et uniquement si l'école n'a pas d'utilisateurs associés
        return $user->hasRole('admin') && $school->hosts()->count() === 0;
    }

    /**
     * Détermine si l'utilisateur peut supprimer définitivement le modèle.
     */
    public function forceDelete(User $user, School $school): bool
    {
        // Seuls les administrateurs peuvent supprimer définitivement des écoles
        return $user->hasRole('admin');
    }

    /**
     * Détermine si l'utilisateur peut restaurer le modèle.
     */
    public function restore(User $user, School $school): bool
    {
        // Seuls les administrateurs peuvent restaurer des écoles
        return $user->hasRole('admin');
    }

    /**
     * Détermine si l'utilisateur peut gérer les administrateurs de l'école.
     */
    public function manageHosts(User $user, School $school): bool
    {
        // Les administrateurs peuvent gérer les administrateurs de toutes les écoles
        if ($user->hasRole('admin')) {
            return true;
        }

        // Les administrateurs d'école peuvent gérer les administrateurs de leur école
        return $user->isSchoolAdmin() && $user->school_id === $school->id;
    }
}

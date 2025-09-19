<?php

namespace App\Policies;

use App\Models\Remuneration;
use App\Models\User;
use Illuminate\Auth\Access\Response;
use Illuminate\Support\Facades\Log;

class RemunerationPolicy
{
    /**
     * Determine whether the user can view any models.
     * Un admin peut tout voir, un utilisateur ne peut voir que ses propres rémunérations
     */
    public function viewAny(User $user): bool
    {
        // Tous les utilisateurs authentifiés peuvent voir leurs propres rémunérations
        // Les administrateurs peuvent tout voir
        return true;
    }

    /**
     * Determine whether the user can view the model.
     * Un admin peut tout voir, un utilisateur ne peut voir que ses propres rémunérations
     */
    public function view(User $user, Remuneration $remuneration): bool
    {
        // L'administrateur peut tout voir
        if ($user->isAdmin()) {
            return true;
        }
        
        // L'utilisateur peut voir ses propres rémunérations
        $canView = $user->id === $remuneration->user_id;
        
        // Log pour le débogage
        Log::info('Vérification des droits de visualisation', [
            'user_id' => $user->id,
            'remuneration_user_id' => $remuneration->user_id,
            'can_view' => $canView,
            'is_admin' => $user->isAdmin()
        ]);
        
        return $canView;
    }

    /**
     * Determine whether the user can create models.
     * Tous les utilisateurs authentifiés peuvent créer des rémunérations
     */
    public function create(User $user): bool
    {
        return true;
    }

    /**
     * Determine whether the user can update the model.
     * Seul un admin peut mettre à jour une rémunération
     */
    public function update(User $user, Remuneration $remuneration): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can delete the model.
     * Seul un admin peut supprimer une rémunération
     */
    public function delete(User $user, Remuneration $remuneration): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can restore the model.
     * Seul un admin peut restaurer une rémunération
     */
    public function restore(User $user, Remuneration $remuneration): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can permanently delete the model.
     * Seul un admin peut supprimer définitivement une rémunération
     */
    public function forceDelete(User $user, Remuneration $remuneration): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine whether the user can mark a remuneration as paid.
     * Only admins can mark remunerations as paid.
     */
    public function markAsPaid(User $user, Remuneration $remuneration): bool
    {
        return $user->isAdmin() && $remuneration->status === 'pending';
    }

    /**
     * Determine whether the user can cancel a remuneration.
     * Only admins can cancel remunerations.
     */
    public function cancel(User $user, Remuneration $remuneration): bool
    {
        return $user->isAdmin() && $remuneration->status === 'pending';
    }
}

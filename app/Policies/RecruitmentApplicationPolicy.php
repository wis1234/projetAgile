<?php

namespace App\Policies;

use App\Models\Recruitment;
use App\Models\RecruitmentApplication;
use App\Models\User;
use Illuminate\Auth\Access\HandlesAuthorization;

class RecruitmentApplicationPolicy
{
    use HandlesAuthorization;

    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user, Recruitment $recruitment): bool
    {
        // Seuls les administrateurs ou le créateur de l'offre peuvent voir toutes les candidatures
        return $user->hasRole('admin') || 
               $user->id === $recruitment->created_by;
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, RecruitmentApplication $application): bool
    {
        // L'utilisateur peut voir sa propre candidature
        if ($user->id === $application->user_id) {
            return true;
        }

        // Les administrateurs et le créateur de l'offre peuvent voir toutes les candidatures
        return $user->hasRole('admin') || 
               $user->id === $application->recruitment->created_by;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user, Recruitment $recruitment): bool
    {
        // Vérifie si l'utilisateur peut postuler à cette offre
        return $recruitment->status === 'published' && 
               $user->hasRole('candidate') &&
               !$recruitment->applications()->where('user_id', $user->id)->exists();
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user, RecruitmentApplication $application): bool
    {
        // Seuls les administrateurs ou le créateur de l'offre peuvent mettre à jour une candidature
        return $user->can('update recruitment application') || 
               $user->id === $application->recruitment->created_by;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, RecruitmentApplication $application): bool
    {
        // L'utilisateur peut supprimer sa propre candidature si elle est toujours en attente
        if ($user->id === $application->user_id && $application->status === 'pending') {
            return true;
        }

        // Les administrateurs et le créateur de l'offre peuvent supprimer la candidature
        return $user->can('delete recruitment application') || 
               $user->id === $application->recruitment->created_by;
    }

    /**
     * Determine whether the user can restore the model.
     */
    public function restore(User $user, RecruitmentApplication $application): bool
    {
        return $user->can('restore recruitment application');
    }

    /**
     * Determine whether the user can permanently delete the model.
     */
    public function forceDelete(User $user, RecruitmentApplication $application): bool
    {
        return $user->can('force delete recruitment application');
    }

    /**
     * Determine whether the user can download the resume.
     */
    public function downloadResume(User $user, RecruitmentApplication $application): bool
    {
        // L'utilisateur peut télécharger son propre CV
        if ($user->id === $application->user_id) {
            return true;
        }

        // Les administrateurs et le créateur de l'offre peuvent télécharger le CV
        return $user->can('view recruitment application') || 
               $user->id === $application->recruitment->created_by;
    }

    /**
     * Determine whether the user can update the status of the application.
     */
    public function updateStatus(User $user, RecruitmentApplication $application): bool
    {
        // Seuls les administrateurs ou le créateur de l'offre peuvent mettre à jour le statut
        return $user->can('update recruitment application status') || 
               $user->id === $application->recruitment->created_by;
    }
}

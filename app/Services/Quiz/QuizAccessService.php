<?php

namespace App\Services\Quiz;

use App\Models\Project;
use App\Models\Quiz;
use App\Models\QuizCandidate;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;

/**
 * Qui peut voir / passer quel quiz.
 *
 *  - Responsables du projet et administrateurs : tout, brouillons compris.
 *  - Membres du projet : les quiz publiés, sauf ceux « réservés aux candidats » où ils ne sont pas inscrits.
 *  - Candidats inscrits (même hors projet) : les quiz publiés auxquels ils ont été ajoutés.
 */
class QuizAccessService
{
    /** Le quiz est-il accessible à cet utilisateur (hors droits de gestion) ? */
    public function canAccess(User $user, Quiz $quiz, Project $project): bool
    {
        if ($quiz->project_id !== $project->id || $quiz->is_draft) {
            return false;
        }

        $enrolled = $quiz->isCandidate($user);

        if ($project->isMember($user)) {
            return ! $quiz->restricted_to_candidates || $enrolled;
        }

        return $enrolled;
    }

    /** Identifiants des projets où l'utilisateur est responsable actif. */
    public function managedProjectIds(User $user): array
    {
        return $user->projects()
            ->wherePivot('role', 'manager')
            ->wherePivot('is_muted', false)
            ->pluck('projects.id')
            ->all();
    }

    /**
     * Tous les quiz visibles par l'utilisateur, tous projets confondus (liste « Quiz » du menu).
     */
    public function visibleQuizzes(User $user): Builder
    {
        $query = Quiz::query();

        if ($user->hasRole('admin')) {
            return $query;
        }

        $managed = $this->managedProjectIds($user);
        $memberProjects = $user->projects()->pluck('projects.id')->all();
        $enrolled = QuizCandidate::where('user_id', $user->id)->pluck('quiz_id')->all();

        return $query->where(function (Builder $q) use ($managed, $memberProjects, $enrolled) {
            // Responsable : tout ce qui est dans ses projets (brouillons compris).
            $q->whereIn('project_id', $managed)
                // Membre : quiz publiés, hors quiz réservés aux candidats où il n'est pas inscrit.
                ->orWhere(function (Builder $q) use ($memberProjects, $enrolled) {
                    $q->where('is_draft', false)
                        ->whereIn('project_id', $memberProjects)
                        ->where(function (Builder $q) use ($enrolled) {
                            $q->where('restricted_to_candidates', false)->orWhereIn('id', $enrolled);
                        });
                })
                // Candidat inscrit : quel que soit le projet.
                ->orWhere(function (Builder $q) use ($enrolled) {
                    $q->where('is_draft', false)->whereIn('id', $enrolled);
                });
        });
    }
}

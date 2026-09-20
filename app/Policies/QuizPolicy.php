<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Quiz;
use App\Models\User;
use App\Services\Quiz\QuizAccessService;

class QuizPolicy
{
    public function __construct(private QuizAccessService $access)
    {
    }

    public function viewAny(User $user, Project $project): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $project->isMember($user);
    }

    public function view(User $user, Quiz $quiz, Project $project): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($quiz->project_id !== $project->id) {
            return false;
        }

        // Un brouillon n'est visible que de ceux qui gèrent les quiz.
        if ($quiz->is_draft) {
            return $project->userCanManageQuizzes($user);
        }

        return $project->userCanManageQuizzes($user) || $this->access->canAccess($user, $quiz, $project);
    }

    public function create(User $user, Project $project): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'manager')
            ->wherePivot('is_muted', false)
            ->exists();
    }

    public function update(User $user, Quiz $quiz, Project $project): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($quiz->created_by === $user->id) {
            return true;
        }

        return $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'manager')
            ->wherePivot('is_muted', false)
            ->exists();
    }

    public function delete(User $user, Quiz $quiz, Project $project): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if ($quiz->created_by === $user->id) {
            return true;
        }

        return $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'manager')
            ->wherePivot('is_muted', false)
            ->exists();
    }

    public function launch(User $user, Quiz $quiz, Project $project): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        if (!$quiz->is_active || $quiz->is_draft || $quiz->project_id !== $project->id) {
            return false;
        }

        // Un membre suspendu (muet) ne passe pas le quiz ; un candidat inscrit hors projet, si.
        $mutedMember = $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('is_muted', true)
            ->exists();

        return !$mutedMember
            && ($project->userCanManageQuizzes($user) || $this->access->canAccess($user, $quiz, $project));
    }

    public function viewResults(User $user, Quiz $quiz, Project $project): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        $isManager = $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'manager')
            ->wherePivot('is_muted', false)
            ->exists();

        if ($isManager) {
            return true;
        }

        return $quiz->show_results && $this->access->canAccess($user, $quiz, $project);
    }

    public function grade(User $user, Project $project): bool
    {
        if ($user->hasRole('admin')) {
            return true;
        }

        return $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('role', 'manager')
            ->wherePivot('is_muted', false)
            ->exists();
    }

    /**
     * Correction, délibération, exports, bonus de participation et cumuls :
     * réservés aux gestionnaires du projet (admin ou manager actif).
     */
    public function manage(User $user, Project $project): bool
    {
        return $this->grade($user, $project);
    }
}

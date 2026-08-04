<?php

namespace App\Policies;

use App\Models\Project;
use App\Models\Quiz;
use App\Models\User;

class QuizPolicy
{
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

        return $project->isMember($user) && $quiz->project_id === $project->id;
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

        return $project->users()
            ->where('user_id', $user->id)
            ->wherePivot('is_muted', false)
            ->exists() && $quiz->is_active;
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

        return $quiz->show_results && $project->isMember($user);
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
}

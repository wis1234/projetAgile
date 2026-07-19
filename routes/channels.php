<?php

use App\Models\Task;
use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('task.{taskId}.comments', function ($user, $taskId) {
    $task = Task::with('project')->find($taskId);

    if (!$task) {
        return false;
    }

    if ($user->hasRole('admin')) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    $isProjectMember = $task->project
        && $task->project->users()->where('user_id', $user->id)->exists();

    $isAssigned = $task->assigned_to === $user->id;

    if ($isProjectMember || $isAssigned) {
        return ['id' => $user->id, 'name' => $user->name];
    }

    return false;
});
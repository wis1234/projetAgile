<?php

use App\Models\Task;
use App\Models\File;

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('presence-task.{taskId}', function ($user, $taskId) {
    // vérifie que $user a accès à la tâche $taskId
    return ['id' => $user->id, 'name' => $user->name, 'profile_photo_url' => $user->profile_photo_url];
});

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

Broadcast::channel('presence-project.{projectId}', function ($user, $projectId) {
    $project = \App\Models\Project::find($projectId);
    if (!$project) return false;
    $isMember = $project->users()->where('users.id', $user->id)->exists();
    if (!$isMember) return false;
    return ['id' => $user->id, 'name' => $user->name, 'profile_photo_url' => $user->profile_photo_url];
});

Broadcast::channel('user.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});


// ... modifications comme google Docs ...

Broadcast::channel('presence-document.{fileId}', function ($user, $fileId) {
    $file = File::find($fileId);
    if (!$file) return false;

    if (!$file->canUser($user, 'view')) return false; // 'none' exclu automatiquement

    return [
        'id'                => $user->id,
        'name'              => $user->name,
        'color'             => sprintf('#%06X', crc32((string) $user->id) & 0xFFFFFF),
        'profile_photo_url' => $user->profile_photo_url, // même clé que tes autres canaux + ton composant Avatar
    ];
});
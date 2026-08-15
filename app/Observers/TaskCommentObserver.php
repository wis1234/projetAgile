<?php

namespace App\Observers;

use App\Models\TaskComment;

class TaskCommentObserver
{
    public function created(TaskComment $comment): void
    {
        $comment->loadMissing('task');

        $action = $comment->parent_id
            ? 'a répondu à un commentaire sur'
            : 'a commenté la tâche';

        activity_log(
            'comment',
            "{$action} « {$comment->task->title} »",
            $comment,
            $comment->user_id
        );
    }

    public function updated(TaskComment $comment): void
    {
        if (!$comment->wasChanged('content')) {
            return;
        }

        $comment->loadMissing('task');

        activity_log(
            'update',
            "a modifié un commentaire sur « {$comment->task->title} »",
            $comment,
            $comment->user_id
        );
    }

    public function deleted(TaskComment $comment): void
    {
        $comment->loadMissing('task');

        activity_log(
            'delete',
            "a supprimé un commentaire sur « {$comment->task->title} »",
            $comment
        );
    }
}

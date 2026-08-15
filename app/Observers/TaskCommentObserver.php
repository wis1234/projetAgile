<?php

namespace App\Observers;

use App\Models\TaskComment;
use App\Models\Activity;

class TaskCommentObserver
{
    public function created(TaskComment $comment)
    {
        // Ne pas logger les réponses comme des commentaires "vides" si le contenu est juste un fallback
        $action = $comment->parent_id ? 'a répondu à un commentaire sur' : 'a commenté la tâche';

        Activity::create([
            'user_id' => $comment->user_id,
            'type' => 'create',
            'subject_type' => TaskComment::class,
            'subject_id' => $comment->id,
            'description' => "{$action} « {$comment->task->title} »",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }

    public function updated(TaskComment $comment)
    {
        if ($comment->wasChanged('content')) {
            Activity::create([
                'user_id' => $comment->user_id,
                'type' => 'update',
                'subject_type' => TaskComment::class,
                'subject_id' => $comment->id,
                'description' => "a modifié un commentaire sur « {$comment->task->title} »",
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);
        }
    }

    public function deleted(TaskComment $comment)
    {
        Activity::create([
            'user_id' => auth()->id(),
            'type' => 'delete',
            'subject_type' => TaskComment::class,
            'subject_id' => $comment->id,
            'description' => "a supprimé un commentaire sur « {$comment->task->title} »",
            'ip_address' => request()->ip(),
            'user_agent' => request()->userAgent(),
        ]);
    }
}
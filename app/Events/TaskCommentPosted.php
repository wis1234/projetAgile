<?php

namespace App\Events;

use App\Models\TaskComment;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class TaskCommentPosted implements ShouldBroadcastNow
{
    use SerializesModels;

    public TaskComment $comment;
    public int $taskId;

    public function __construct(TaskComment $comment, int $taskId)
    {
        $this->comment = $comment->load('user:id,name,profile_photo_path,role', 'parent.user:id,name');
        $this->taskId = $taskId;
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('task.' . $this->taskId . '.comments')];
    }

    public function broadcastAs(): string
    {
        return 'comment.posted';
    }

    public function broadcastWith(): array
    {
        return [
            'comment' => [
                'id'         => $this->comment->id,
                'content'    => $this->comment->content,
                'audio_path' => $this->comment->audio_path,
                'parent_id'  => $this->comment->parent_id,
                'level'      => $this->comment->level,
                'created_at' => $this->comment->created_at->toIso8601String(),
                'updated_at' => $this->comment->updated_at->toIso8601String(),
                'user' => [
                    'id'                => $this->comment->user->id,
                    'name'              => $this->comment->user->name,
                    'profile_photo_url' => $this->comment->user->profile_photo_url ?? null,
                    'role'              => $this->comment->user->role ?? null,
                ],
                'parent' => $this->comment->parent ? [
                    'id'      => $this->comment->parent->id,
                    'content' => $this->comment->parent->content,
                    'user'    => [
                        'name' => $this->comment->parent->user->name ?? null,
                    ],
                ] : null,
            ],
        ];
    }
}
<?php

namespace App\Events;

use App\Models\TaskComment;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class TaskCommentUpdated implements ShouldBroadcastNow
{
    use SerializesModels;

    public TaskComment $comment;
    public int $taskId;

    public function __construct(TaskComment $comment, int $taskId)
    {
        $this->comment = $comment->load('user:id,name,profile_photo_path,role');
        $this->taskId = $taskId;
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('task.' . $this->taskId . '.comments')];
    }

    public function broadcastAs(): string
    {
        return 'comment.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'comment' => [
                'id'         => $this->comment->id,
                'content'    => $this->comment->content,
                'updated_at' => $this->comment->updated_at->toIso8601String(),
            ],
        ];
    }
}
<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class TaskCommentDeleted implements ShouldBroadcastNow
{
    use SerializesModels;

    public int $commentId;
    public int $taskId;

    public function __construct(int $commentId, int $taskId)
    {
        $this->commentId = $commentId;
        $this->taskId = $taskId;
    }

    public function broadcastOn(): array
    {
        return [new PrivateChannel('task.' . $this->taskId . '.comments')];
    }

    public function broadcastAs(): string
    {
        return 'comment.deleted';
    }

    public function broadcastWith(): array
    {
        return ['commentId' => $this->commentId];
    }
}
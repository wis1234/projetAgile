<?php

namespace App\Events;

use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class FileCommentDeleted implements ShouldBroadcastNow
{
    use SerializesModels;

    public int $commentId;
    public int $fileId;

    public function __construct(int $commentId, int $fileId)
    {
        $this->commentId = $commentId;
        $this->fileId = $fileId;
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('presence-document.' . $this->fileId)];
    }

    public function broadcastAs(): string
    {
        return 'FileCommentDeleted';
    }

    public function broadcastWith(): array
    {
        return [
            'id' => $this->commentId
        ];
    }
}

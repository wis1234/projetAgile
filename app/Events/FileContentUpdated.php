<?php

namespace App\Events;

use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class FileContentUpdated implements ShouldBroadcastNow
{
    use SerializesModels;

    public int $fileId;
    public int $userId;

    public function __construct(int $fileId, int $userId)
    {
        $this->fileId = $fileId;
        $this->userId = $userId;
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('presence-document.' . $this->fileId)];
    }

    public function broadcastAs(): string
    {
        return 'FileContentUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'file_id' => $this->fileId,
            'user_id' => $this->userId
        ];
    }
}

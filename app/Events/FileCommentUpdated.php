<?php

namespace App\Events;

use App\Models\FileComment;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Queue\SerializesModels;

class FileCommentUpdated implements ShouldBroadcastNow
{
    use SerializesModels;

    public FileComment $comment;
    public int $fileId;

    public function __construct(FileComment $comment, int $fileId)
    {
        $this->comment = $comment->load('user:id,name,profile_photo_path,role');
        $this->fileId = $fileId;
    }

    public function broadcastOn(): array
    {
        return [new PresenceChannel('presence-document.' . $this->fileId)];
    }

    public function broadcastAs(): string
    {
        return 'FileCommentUpdated';
    }

    public function broadcastWith(): array
    {
        return [
            'comment' => $this->comment->toArray()
        ];
    }
}

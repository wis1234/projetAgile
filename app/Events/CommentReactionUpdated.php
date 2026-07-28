<?php
namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class CommentReactionUpdated implements ShouldBroadcast
{
    use InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $taskId,
        public int $commentId,
        public array $reactions
    ) {}

    public function broadcastOn(): array
    {
        return [new PresenceChannel('presence-task.' . $this->taskId)];
    }

    public function broadcastAs(): string
    {
        return 'comment.reaction.updated';
    }

    public function broadcastWith(): array
    {
        return [
            'commentId' => $this->commentId,
            'reactions' => $this->reactions,
        ];
    }
}
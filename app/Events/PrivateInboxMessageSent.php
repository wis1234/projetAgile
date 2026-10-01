<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PrivateInboxMessageSent implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $conversationId,
        public int $senderId,
        public int $receiverId,
        public array $message,
    ) {
    }

    public function broadcastOn(): array
    {
        $participants = [$this->senderId, $this->receiverId];
        sort($participants, SORT_NUMERIC);

        return [
            // Fil de la conversation ouverte
            new PrivateChannel('private-inbox.' . $participants[0] . '.' . $participants[1]),
            // Canal personnel du destinataire : met à jour la liste / les badges sans ouvrir la conversation
            new PrivateChannel('user.' . $this->receiverId),
        ];
    }

    public function broadcastAs(): string
    {
        return 'inbox.message';
    }

    public function broadcastWith(): array
    {
        return [
            'conversation_id' => $this->conversationId,
            'message' => $this->message,
        ];
    }
}

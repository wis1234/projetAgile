<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/** Le lecteur a ouvert la conversation : l'expéditeur voit passer ses messages en « lu » (✓✓ bleus). */
class PrivateInboxMessagesRead implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $readerId,
        public int $senderId,
        public array $messageIds,
        public string $readAt,
    ) {
    }

    public function broadcastOn(): array
    {
        $participants = [$this->readerId, $this->senderId];
        sort($participants, SORT_NUMERIC);

        return [new PrivateChannel('private-inbox.' . $participants[0] . '.' . $participants[1])];
    }

    public function broadcastAs(): string
    {
        return 'inbox.read';
    }

    public function broadcastWith(): array
    {
        return [
            'reader_id' => $this->readerId,
            'message_ids' => $this->messageIds,
            'read_at' => $this->readAt,
        ];
    }
}

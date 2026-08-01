<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveKitCallEnded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $projectId,
        public int $initiatorId,
        public array $memberIds,
    ) {}

    public function broadcastOn()
    {
        return collect($this->memberIds)
            ->reject(fn($id) => $id == $this->initiatorId)
            ->map(fn($id) => new PrivateChannel('user.' . $id))
            ->all();
    }

    public function broadcastAs()
    {
        return 'livekit.call.ended';
    }

    public function broadcastWith()
    {
        return ['projectId' => $this->projectId];
    }
}
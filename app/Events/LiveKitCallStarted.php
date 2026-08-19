<?php

namespace App\Events;

use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveKitCallStarted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public int $projectId,
        public string $projectName,
        public int $initiatorId,
        public string $initiatorName,
        public array $memberIds,
        public string $inviteUrl = '',
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
        return 'livekit.call.started';
    }

    public function broadcastWith()
    {
        return [
            'projectId' => $this->projectId,
            'projectName' => $this->projectName,
            'initiatorId' => $this->initiatorId,
            'initiatorName' => $this->initiatorName,
            'inviteUrl' => $this->inviteUrl,
        ];
    }
}
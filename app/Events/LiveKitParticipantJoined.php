<?php

namespace App\Events;

use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class LiveKitParticipantJoined implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public int $projectId;
    public string $projectName;
    public int $userId;
    public string $userName;
    public array $memberIds;

    public function __construct(int $projectId, string $projectName, int $userId, string $userName, array $memberIds)
    {
        $this->projectId = $projectId;
        $this->projectName = $projectName;
        $this->userId = $userId;
        $this->userName = $userName;
        // On exclut la personne qui vient de rejoindre : elle n'a pas besoin
        // de se notifier elle-même qu'elle a rejoint l'appel.
        $this->memberIds = array_values(array_filter($memberIds, fn($id) => (int) $id !== $userId));
    }

    public function broadcastOn(): array
    {
        return array_map(fn($id) => new PrivateChannel('user.' . $id), $this->memberIds);
    }

    public function broadcastAs(): string
    {
        return 'livekit.participant.joined';
    }

    public function broadcastWith(): array
    {
        return [
            'projectId' => $this->projectId,
            'projectName' => $this->projectName,
            'userId' => $this->userId,
            'userName' => $this->userName,
        ];
    }
}
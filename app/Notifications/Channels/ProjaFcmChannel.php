<?php

namespace App\Notifications\Channels;

use App\Services\FcmService;
use Illuminate\Notifications\Notification;

class ProjaFcmChannel
{
    public function __construct(private FcmService $fcmService)
    {
    }

    /**
     * Envoie le push natif (Android/iOS) si la notification définit toFcm().
     * Les notifications qui n'implémentent pas toFcm() sont simplement
     * ignorées par ce canal (ex: notifications purement internes).
     */
    public function send($notifiable, Notification $notification)
    {
        if (!method_exists($notification, 'toFcm')) {
            return;
        }

        $payload = $notification->toFcm($notifiable);

        if (empty($payload)) {
            return;
        }

        $this->fcmService->sendActivityNotification(
            $notifiable,
            $payload['title'] ?? 'ProJA',
            $payload['body'] ?? '',
            $payload['url'] ?? null
        );
    }
}
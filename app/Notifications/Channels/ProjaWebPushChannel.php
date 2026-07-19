<?php

namespace App\Notifications\Channels;

use App\Services\WebPushService;
use Illuminate\Notifications\Notification;

class ProjaWebPushChannel
{
    public function __construct(private WebPushService $webPushService)
    {
    }

    /**
     * Envoie la notification via le service maison (table PushSubscription).
     */
    public function send($notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toWebPush')) {
            return;
        }

        $message = $notification->toWebPush($notifiable, $notification);

        // $message est un tableau simple, prêt à être encodé en JSON par le service
        $this->webPushService->sendToUser($notifiable, $message);
    }
}
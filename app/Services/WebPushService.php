<?php

namespace App\Services;

use App\Models\PushSubscription;
use App\Models\User;
use Minishlink\WebPush\WebPush;
use Minishlink\WebPush\Subscription;

class WebPushService
{
    private WebPush $webPush;

public function __construct()
{
    $auth = [
        'VAPID' => [
            'subject'    => config('webpush.vapid.subject'),
            'publicKey'  => config('webpush.vapid.public_key'),
            'privateKey' => config('webpush.vapid.private_key'),
        ],
    ];

    $this->webPush = new WebPush($auth);

    $this->webPush->setDefaultOptions([
        'TTL' => 86400,
    ]);
}

    /**
     * Envoyer une notification push à un utilisateur spécifique
     */
    public function sendToUser(User $user, array $payload): void
    {
        $subscriptions = PushSubscription::where('user_id', $user->id)->get();

        if ($subscriptions->isEmpty()) {
            return;
        }

        foreach ($subscriptions as $sub) {
            $this->webPush->queueNotification(
                Subscription::create($sub->toWebPushSubscription()),
                json_encode(array_merge([
                    'icon'  => '/logo-proja.png',
                    'badge' => '/logo-proja.png',
                ], $payload))
            );
        }

        // Envoyer toutes les notifications en file
        foreach ($this->webPush->flush() as $report) {
            if ($report->isSubscriptionExpired()) {
                // Supprimer l'abonnement expiré de la BDD
                PushSubscription::where('endpoint', $report->getEndpoint())->delete();
            }
        }
    }

    /**
     * Envoyer une notification push à plusieurs utilisateurs
     */
    public function sendToUsers(iterable $users, array $payload): void
    {
        foreach ($users as $user) {
            $this->sendToUser($user, $payload);
        }
    }

    /**
     * Envoyer une notification à tous les abonnés (broadcast)
     */
    public function sendToAll(array $payload): void
    {
        $subscriptions = PushSubscription::all();

        foreach ($subscriptions as $sub) {
            $this->webPush->queueNotification(
                Subscription::create($sub->toWebPushSubscription()),
                json_encode(array_merge([
                    'icon'  => '/logo-proja.png',
                    'badge' => '/logo-proja.png',
                ], $payload))
            );
        }

        foreach ($this->webPush->flush() as $report) {
            if ($report->isSubscriptionExpired()) {
                PushSubscription::where('endpoint', $report->getEndpoint())->delete();
            }
        }
    }
}

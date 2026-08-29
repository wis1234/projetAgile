<?php

namespace App\Services;

use App\Models\DeviceToken;
use App\Models\User;
use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Contract\Messaging;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\MulticastSendReport;

class FcmService
{
    public function __construct(private Messaging $messaging)
    {
    }

    /**
     * Notifie un utilisateur d'un appel ProJA entrant (LiveKit).
     * Payload data-only : reçu par MyFirebaseMessagingService côté Android
     * même app fermée, et déclenche l'écran plein écran IncomingCallActivity.
     */
    public function sendCallNotification(User $user, array $call): ?MulticastSendReport
    {
        return $this->sendDataMessage($user, [
            'type' => 'call',
            'projectId' => (string) $call['projectId'],
            'projectName' => (string) $call['projectName'],
            'initiatorName' => (string) $call['initiatorName'],
            'inviteUrl' => (string) ($call['inviteUrl'] ?? ''),
        ]);
    }

    /**
     * Notifie un utilisateur d'une activité / notification classique
     * (mention, tâche assignée, etc.), affichée via le canal "default_channel".
     */
    public function sendActivityNotification(User $user, string $title, string $body, ?string $url = null): ?MulticastSendReport
    {
        return $this->sendDataMessage($user, [
            'type' => 'message',
            'title' => $title,
            'body' => $body,
            'url' => $url ?? '',
        ]);
    }

    /**
     * Envoie un message data-only à tous les appareils Android/iOS
     * enregistrés pour cet utilisateur. Les tokens invalides ou expirés
     * (désinstallation, etc.) sont automatiquement nettoyés de la table.
     */
    private function sendDataMessage(User $user, array $data): ?MulticastSendReport
    {
        $tokens = DeviceToken::where('user_id', $user->id)
            ->whereIn('platform', ['android', 'ios'])
            ->pluck('token')
            ->all();

        if (empty($tokens)) {
            return null;
        }

        // Message data-only volontairement (pas de clé "notification") :
        // c'est ce qui force Android à toujours passer par notre
        // FirebaseMessagingService, même quand l'app est fermée ou en
        // arrière-plan, plutôt que d'afficher une notif système par défaut.
        $message = CloudMessage::new()->withData($data);

        // Priorité "high" indispensable pour les appels : sans ça, FCM peut
        // retarder la livraison si le téléphone est en veille profonde (Doze).
        $message = $message->withAndroidConfig([
            'priority' => 'high',
        ]);

        try {
            $report = $this->messaging->sendMulticast($message, $tokens);

            foreach ($report->invalidTokens() as $invalidToken) {
                DeviceToken::where('token', $invalidToken)->delete();
            }

            return $report;
        } catch (\Throwable $e) {
            Log::error('Échec envoi FCM', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);
            return null;
        }
    }
}
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class WebhookController extends Controller
{
    public function handleFedapayWebhook(Request $request)
    {
        $payload = $request->all();
        Log::info('Fedapay Webhook Received:', $payload);

        // Vérifier la signature du webhook
        $signature = $request->header('X-Fedapay-Signature');
        if (!$this->verifyWebhookSignature($signature, $payload)) {
            Log::error('Signature webhook invalide');
            return response()->json(['error' => 'Signature invalide'], 401);
        }

        $event = $payload['event'] ?? null;
        $transactionId = $payload['data']['id'] ?? null;

        if (!$event || !$transactionId) {
            Log::error('Données webhook invalides', $payload);
            return response()->json(['error' => 'Données invalides'], 400);
        }

        // Gérer les différents types d'événements
        switch ($event) {
            case 'transaction.approved':
                return $this->handleTransactionApproved($transactionId, $payload);
            case 'transaction.declined':
                return $this->handleTransactionDeclined($transactionId, $payload);
            default:
                Log::info("Événement webhook non géré: {$event}");
                return response()->json(['status' => 'ignoré']);
        }
    }

    protected function handleTransactionApproved($transactionId, $payload)
    {
        try {
            // Trouver ou créer l'abonnement
            $subscription = \App\Models\Subscription::updateOrCreate(
                ['payment_id' => $transactionId],
                [
                    'status' => 'active',
                    'amount_paid' => $payload['data']['amount'] / 100, // Convertir en unité monétaire
                    'currency' => $payload['data']['currency'] ?? 'XOF',
                    'payment_method' => $payload['data']['payment_method'] ?? 'card',
                    'payment_details' => $payload,
                    'starts_at' => now(),
                    'ends_at' => now()->addMonth(),
                ]
            );

            // Mettre à jour le statut d'abonnement de l'utilisateur
            if ($subscription->user) {
                $subscription->user->update([
                    'subscription_status' => 'active',
                    'subscription_ends_at' => $subscription->ends_at
                ]);
            }

            return response()->json(['status' => 'succès']);
        } catch (\Exception $e) {
            Log::error("Erreur lors du traitement de la transaction approuvée {$transactionId}: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    protected function handleTransactionDeclined($transactionId, $payload)
    {
        try {
            \App\Models\Subscription::where('payment_id', $transactionId)
                ->update([
                    'status' => 'declined',
                    'payment_details' => $payload
                ]);
            return response()->json(['status' => 'mis à jour']);
        } catch (\Exception $e) {
            Log::error("Erreur lors du traitement de la transaction refusée {$transactionId}: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    protected function verifyWebhookSignature($signature, $payload)
    {
        $secret = config('services.fedapay.webhook_secret');
        $computedSignature = hash_hmac('sha256', json_encode($payload), $secret);
        return hash_equals($signature, $computedSignature);
    }
}

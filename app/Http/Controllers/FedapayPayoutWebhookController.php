<?php

namespace App\Http\Controllers;

use App\Models\Withdrawal;
use App\Services\FedapayPayoutService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * Webhook Fedapay dédié aux retraits (events « payout.* »).
 * Signature vérifiée avec le SDK (en-tête X-FEDAPAY-SIGNATURE) ; sans secret configuré, la requête est refusée
 * et le suivi repose sur la vérification planifiée (CheckWithdrawalStatus).
 */
class FedapayPayoutWebhookController extends Controller
{
    public function __invoke(Request $request, FedapayPayoutService $service)
    {
        $secret = config('services.fedapay.webhook_secret');
        $raw = $request->getContent();

        if (!$secret) {
            Log::warning('Fedapay payout webhook ignoré : FEDAPAY_WEBHOOK_SECRET absent.');
            return response()->json(['message' => 'Webhook non configuré'], 400);
        }

        try {
            $event = \FedaPay\Webhook::constructEvent($raw, (string) $request->header('X-FEDAPAY-SIGNATURE'), $secret);
        } catch (\Throwable $e) {
            Log::warning('Fedapay payout webhook : signature invalide', ['error' => $e->getMessage()]);
            return response()->json(['message' => 'Signature invalide'], 400);
        }

        $name = (string) ($event->name ?? '');
        if (!str_starts_with($name, 'payout.')) {
            return response()->json(['message' => 'ignoré']);
        }

        $entity = $event->entity ?? null;
        $payoutId = (string) ($entity->id ?? '');
        $withdrawal = $payoutId ? Withdrawal::where('fedapay_payout_id', $payoutId)->first() : null;

        if (!$withdrawal) {
            return response()->json(['message' => 'retrait inconnu']);
        }

        // Le nom de l'événement fait foi (payout.sent / payout.failed…), le statut de l'entité en complément
        $status = (string) ($entity->status ?? '');
        if (str_contains($name, 'sent')) {
            $status = 'sent';
        } elseif (str_contains($name, 'fail') || str_contains($name, 'declin') || str_contains($name, 'cancel')) {
            $status = 'failed';
        }

        $service->apply($withdrawal, $status, $entity->last_error_message ?? null);

        return response()->json(['message' => 'ok']);
    }
}

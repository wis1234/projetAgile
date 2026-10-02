<?php

namespace App\Services;

use App\Models\User;
use App\Models\Withdrawal;
use App\Notifications\UserActionMailNotification;
use FedaPay\FedaPay;
use FedaPay\Payout;
use Illuminate\Support\Facades\Log;

/**
 * Envoi d'un retrait via l'API Payouts de Fedapay et synchronisation des statuts.
 * Les trois chemins (job d'envoi, webhook, vérification planifiée) passent par apply() : une seule règle de transition.
 */
class FedapayPayoutService
{
    private function boot(): void
    {
        FedaPay::setApiKey(config('services.fedapay.secret_key'));
        FedaPay::setEnvironment(config('services.fedapay.environment', 'live'));
    }

    /** +229XXXXXXXX à partir d'une saisie libre ; null si invalide. */
    public static function normalizePhone(string $raw): ?string
    {
        $dial = (string) config('services.fedapay.payout_dial_code', '229');
        $digits = preg_replace('/\D+/', '', $raw);
        $digits = preg_replace('/^00/', '', $digits);
        if (str_starts_with($digits, $dial)) {
            $digits = substr($digits, strlen($dial));
        }
        // Bénin : 8 chiffres (ancien format) ou 10 chiffres (format « 01 » depuis 2024)
        if (!in_array(strlen($digits), [8, 10], true)) {
            return null;
        }
        return '+' . $dial . $digits;
    }

    /** Crée le payout chez Fedapay puis l'envoie. L'identifiant est sauvegardé AVANT l'envoi (pas de doublon possible). */
    public function send(Withdrawal $w): void
    {
        $w->refresh();
        if ($w->status !== Withdrawal::STATUS_PENDING || $w->fedapay_payout_id) {
            return; // déjà traité
        }

        $mode = config("services.fedapay.payout_modes.{$w->method}");
        if (!$mode || !config('services.fedapay.secret_key')) {
            $this->fail($w, 'Service de paiement non configuré. Contactez un administrateur.');
            return;
        }

        $this->boot();
        $user = $w->user;
        $parts = preg_split('/\s+/', trim($user->name), 2);

        try {
            $payout = Payout::create([
                'amount' => (int) round($w->amount - $w->fee),
                'currency' => ['iso' => $w->currency],
                'mode' => $mode,
                'customer' => [
                    'firstname' => $parts[0] ?? $user->name,
                    'lastname' => $parts[1] ?? $parts[0] ?? $user->name,
                    'email' => $user->email,
                    'phone_number' => ['number' => $w->phone_number, 'country' => $w->country],
                ],
            ]);
        } catch (\Throwable $e) {
            Log::error('Fedapay payout create failed', ['withdrawal' => $w->id, 'error' => $e->getMessage()]);
            $this->fail($w, 'Le service de paiement a refusé la demande. Réessayez plus tard.');
            return;
        }

        $w->update([
            'fedapay_payout_id' => (string) $payout->id,
            'fedapay_status' => $payout->status ?? 'pending',
            'status' => Withdrawal::STATUS_PROCESSING,
        ]);

        try {
            $payout->sendNow();
        } catch (\Throwable $e) {
            Log::error('Fedapay payout send failed', ['withdrawal' => $w->id, 'error' => $e->getMessage()]);
            $this->fail($w, "L'envoi vers l'opérateur a échoué. Votre solde n'a pas été débité.");
        }
    }

    /** Interroge Fedapay et applique le statut. Retourne le statut interne final ou courant. */
    public function refresh(Withdrawal $w): string
    {
        if (!$w->fedapay_payout_id || $w->isFinal()) {
            return $w->status;
        }
        $this->boot();
        try {
            $payout = Payout::retrieve($w->fedapay_payout_id);
            $this->apply($w, (string) ($payout->status ?? ''), $payout->last_error_message ?? null);
        } catch (\Throwable $e) {
            Log::warning('Fedapay payout retrieve failed', ['withdrawal' => $w->id, 'error' => $e->getMessage()]);
        }
        $w->increment('checks');
        return $w->fresh()->status;
    }

    /** Transition de statut idempotente. */
    public function apply(Withdrawal $w, string $fedapayStatus, ?string $reason = null): void
    {
        $w->refresh();
        if ($w->isFinal()) {
            return;
        }
        $s = strtolower($fedapayStatus);
        $w->fedapay_status = $s ?: $w->fedapay_status;

        if (in_array($s, ['sent', 'approved', 'completed', 'success', 'successful'], true)) {
            $w->status = Withdrawal::STATUS_COMPLETED;
            $w->processed_at = now();
            $w->save();
            $this->notify($w, 'Retrait effectué',
                "Votre retrait <b>{$w->reference}</b> de <b>" . number_format($w->amount, 0, ',', ' ') . " FCFA</b> a été envoyé sur le {$w->phone_number}.");
        } elseif (in_array($s, ['failed', 'declined', 'canceled', 'cancelled', 'refused', 'error'], true)) {
            $this->fail($w, $reason ?: "L'opérateur a refusé le transfert.");
        } else {
            $w->save(); // toujours en cours
        }
    }

    public function fail(Withdrawal $w, string $reason): void
    {
        if ($w->isFinal()) {
            return;
        }
        $w->update(['status' => Withdrawal::STATUS_FAILED, 'failure_reason' => $reason, 'processed_at' => now()]);
        $this->notify($w, 'Retrait échoué',
            "Votre retrait <b>{$w->reference}</b> de <b>" . number_format($w->amount, 0, ',', ' ') . " FCFA</b> n'a pas abouti : {$reason}<br>Le montant a été remis dans votre solde disponible.");
    }

    private function notify(Withdrawal $w, string $subject, string $message): void
    {
        try {
            $user = $w->user ?? User::find($w->user_id);
            $user?->notify(new UserActionMailNotification($subject, $message, url('/remunerations'), 'Voir mes gains', [
                'preference_key' => 'payment_updates',
            ]));
        } catch (\Throwable $e) {
            Log::warning('Withdrawal notification failed', ['error' => $e->getMessage()]);
        }
    }
}

<?php

namespace App\Jobs;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use FedaPay\FedaPay;
use FedaPay\Transaction;

class VerifyFedapayTransaction implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    protected $subscription;
    protected $transactionId;

    public function __construct($subscription, $transactionId)
    {
        $this->subscription = $subscription;
        $this->transactionId = $transactionId;
    }

    public function handle()
    {
        try {
            // Initialiser FedaPay avec votre clé API
            FedaPay::setApiKey(env('FEDAPAY_LIVE_SECRET_KEY'));
            FedaPay::setEnvironment('live');

            // Récupérer la transaction
            $transaction = Transaction::retrieve($this->transactionId);
            
            // Mettre à jour l'abonnement en fonction du statut de la transaction
            if ($transaction->status === 'approved') {
                $this->subscription->update([
                    'status' => 'active',
                    'amount_paid' => $transaction->amount / 100,
                    'currency' => $transaction->currency ?? 'XOF',
                    'payment_method' => $transaction->payment_method ?? 'card',
                    'starts_at' => now(),
                    'ends_at' => now()->addMonth(),
                    'metadata' => array_merge($this->subscription->metadata ?? [], [
                        'verified_at' => now(),
                        'transaction_data' => $transaction->toArray()
                    ])
                ]);

                // Mettre à jour le statut d'abonnement de l'utilisateur
                if ($this->subscription->user) {
                    $this->subscription->user->update([
                        'subscription_status' => 'active',
                        'subscription_ends_at' => $this->subscription->ends_at
                    ]);
                }
            } else if (in_array($transaction->status, ['declined', 'failed'])) {
                $this->subscription->update([
                    'status' => $transaction->status,
                    'metadata' => array_merge($this->subscription->metadata ?? [], [
                        'verification_failed_at' => now(),
                        'transaction_data' => $transaction->toArray()
                    ])
                ]);
            } else {
                // Si toujours en attente, réessayer plus tard
                throw new \Exception("La transaction {$this->transactionId} est toujours en attente");
            }

        } catch (\Exception $e) {
            \Log::error("Échec de la vérification de la transaction {$this->transactionId}: " . $e->getMessage());
            
            // Réessayer avec un délai exponentiel (jusqu'à 5 fois)
            if ($this->attempts() < 5) {
                $this->release(now()->addMinutes($this->attempts() * 5));
            } else {
                // Marquer comme échec après le nombre maximum de tentatives
                $this->subscription->update([
                    'status' => 'verification_failed',
                    'metadata' => array_merge($this->subscription->metadata ?? [], [
                        'verification_attempts' => $this->attempts(),
                        'last_verification_error' => $e->getMessage()
                    ])
                ]);
            }
        }
    }
}

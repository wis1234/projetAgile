<?php

namespace App\Jobs;

use App\Models\Withdrawal;
use App\Services\FedapayPayoutService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/** Envoie la demande de retrait à Fedapay (1 seul essai : l'envoi n'est jamais rejoué automatiquement). */
class ProcessWithdrawal implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(public Withdrawal $withdrawal)
    {
    }

    public function handle(FedapayPayoutService $service): void
    {
        $service->send($this->withdrawal);

        if ($this->withdrawal->fresh()->status === Withdrawal::STATUS_PROCESSING) {
            CheckWithdrawalStatus::dispatch($this->withdrawal)->delay(now()->addSeconds(20));
        }
    }

    public function failed(\Throwable $e): void
    {
        app(FedapayPayoutService::class)->fail($this->withdrawal->fresh(), 'Erreur technique lors du traitement.');
    }
}

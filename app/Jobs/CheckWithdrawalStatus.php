<?php

namespace App\Jobs;

use App\Models\Withdrawal;
use App\Services\FedapayPayoutService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/** Filet de sécurité si le webhook n'arrive pas : vérifie le statut chez Fedapay (20 s, puis toutes les 2 min, ~1 h max). */
class CheckWithdrawalStatus implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public function __construct(public Withdrawal $withdrawal)
    {
    }

    public function handle(FedapayPayoutService $service): void
    {
        $status = $service->refresh($this->withdrawal);

        if ($status === Withdrawal::STATUS_PROCESSING && $this->withdrawal->fresh()->checks < 30) {
            self::dispatch($this->withdrawal)->delay(now()->addMinutes(2));
        }
    }
}

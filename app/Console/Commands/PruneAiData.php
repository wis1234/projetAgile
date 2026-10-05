<?php

namespace App\Console\Commands;

use App\Models\AiPendingAction;
use App\Models\AiUsage;
use App\Services\Ai\AiSettingsService;
use Illuminate\Console\Command;

/** Purge de l'historique d'usage de l'assistant (durée réglable dans le tableau de bord) et des demandes de confirmation périmées. */
class PruneAiData extends Command
{
    protected $signature = 'ai:prune {--days= : Durée de conservation en jours (sinon : réglage du tableau de bord)}';
    protected $description = "Supprime l'historique d'usage IA ancien et les confirmations expirées";

    public function handle(AiSettingsService $settings): int
    {
        $days = (int) ($this->option('days') ?: ($settings->global()->retention_days ?: 180));
        $days = max(7, $days);

        // Requêtes restées « en cours » (processus interrompu) : on les clôture proprement
        AiUsage::where('status', 'started')->where('created_at', '<', now()->subMinutes(15))
            ->update(['status' => 'failed', 'failure_reason' => 'Requête interrompue']);

        $usage = AiUsage::where('created_at', '<', now()->subDays($days))->delete();
        $pending = AiPendingAction::where('expires_at', '<', now()->subDay())->delete();

        $this->info("Historique IA : {$usage} ligne(s) de plus de {$days} jours supprimée(s) ; {$pending} confirmation(s) périmée(s) supprimée(s).");

        return self::SUCCESS;
    }
}

<?php

namespace App\Console\Commands;

use App\Models\Recruitment;
use Carbon\Carbon;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CloseExpiredRecruitments extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'recruitments:close-expired';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Ferme automatiquement les offres de recrutement dont la date limite est dépassée';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle()
    {
        $now = Carbon::now();
        $this->info("Recherche des offres de recrutement expirées...");
        
        // Récupérer les offres actives avec une date limite dépassée
        $expiredRecruitments = Recruitment::where('status', 'published')
            ->where('auto_close', true)
            ->whereNotNull('deadline')
            ->where('deadline', '<=', $now)
            ->get();
            
        $count = $expiredRecruitments->count();
        
        if ($count === 0) {
            $this->info("Aucune offre à fermer pour le moment.");
            return 0;
        }
        
        $this->info("Fermeture de {$count} offre(s) expirée(s)...");
        
        $bar = $this->output->createProgressBar($count);
        $bar->start();
        
        $closedCount = 0;
        
        foreach ($expiredRecruitments as $recruitment) {
            try {
                $recruitment->status = 'closed';
                $recruitment->save();
                $closedCount++;
                
                // Log de l'action
                Log::info("Offre #{$recruitment->id} fermée automatiquement (date limite: {$recruitment->deadline})");
                
            } catch (\Exception $e) {
                Log::error("Erreur lors de la fermeture automatique de l'offre #{$recruitment->id}: " . $e->getMessage());
                $this->error("Erreur avec l'offre #{$recruitment->id}: " . $e->getMessage());
            }
            
            $bar->advance();
        }
        
        $bar->finish();
        $this->newLine(2);
        
        $this->info("Traitement terminé. {$closedCount}/{$count} offre(s) fermée(s) avec succès.");
        
        return 0;
    }
}

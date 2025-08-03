<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Artisan;

class CheckQueueSetup extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'queue:check-setup';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Vérifie et répare la configuration de la file d\'attente';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info("Vérification de la configuration de la file d'attente...\n");

        // Vérifier la connexion à la base de données
        try {
            DB::connection()->getPdo();
            $this->info("✓ Connexion à la base de données établie avec succès");
        } catch (\Exception $e) {
            $this->error("✗ Impossible de se connecter à la base de données: " . $e->getMessage());
            return 1;
        }

        // Vérifier les tables nécessaires
        $tables = ['jobs', 'failed_jobs', 'job_batches'];
        $allTablesExist = true;

        foreach ($tables as $table) {
            if (Schema::hasTable($table)) {
                $this->info("✓ La table '$table' existe");
            } else {
                $this->warn("✗ La table '$table' n'existe pas");
                $allTablesExist = false;
            }
        }

        if (!$allTablesExist) {
            if ($this->confirm('Voulez-vous créer les tables manquantes ?')) {
                try {
                    Artisan::call('migrate', ['--path' => 'vendor/laravel/framework/src/Illuminate/Queue/Console/stubs']);
                    $this->info("✓ Tables de la file d'attente créées avec succès");
                } catch (\Exception $e) {
                    $this->error("✗ Erreur lors de la création des tables: " . $e->getMessage());
                    return 1;
                }
            } else {
                $this->warn("Les tables manquantes n'ont pas été créées. La file d'attente ne fonctionnera pas correctement.");
                return 1;
            }
        }

        // Vérifier la configuration de la file d'attente
        $queueConnection = config('queue.default');
        $this->info("\nConfiguration de la file d'attente : " . $queueConnection);

        if ($queueConnection === 'sync') {
            $this->warn("⚠ Le mode 'sync' est activé. Les tâches seront exécutées immédiatement et non en file d'attente.");
        }

        // Vérifier les permissions
        $storagePath = storage_path('framework/cache');
        if (!is_writable($storagePath)) {
            $this->warn("⚠ Le dossier $storagePath n'est pas accessible en écriture. Cela peut causer des problèmes avec la file d'attente.");
        }

        // Vérifier les tâches en attente
        $pendingJobs = DB::table('jobs')->count();
        $failedJobs = DB::table('failed_jobs')->count();

        $this->info("\nStatut de la file d'attente :");
        $this->line("- Tâches en attente : " . $pendingJobs);
        $this->line("- Tâches échouées : " . $failedJobs);

        if ($pendingJobs > 0) {
            $this->info("\nPour traiter les tâches en attente, exécutez :");
            $this->line("php artisan queue:work --stop-when-empty");
        }

        if ($failedJobs > 0) {
            $this->warn("\nIl y a des tâches échouées. Pour les voir, exécutez :");
            $this->line("php artisan queue:failed");
        }

        $this->info("\nVérification terminée !");
        return 0;
    }
}

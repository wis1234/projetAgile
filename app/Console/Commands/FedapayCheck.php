<?php

namespace App\Console\Commands;

use App\Services\FedapayPayoutService;
use FedaPay\FedaPay;
use Illuminate\Console\Command;

class FedapayCheck extends Command
{
    protected $signature = 'fedapay:check';
    protected $description = 'Vérifie la configuration Fedapay (clés, environnement, opérateurs) et teste l\'API sans déplacer d\'argent';

    public function handle(): int
    {
        $key = config('services.fedapay.secret_key');
        $env = config('services.fedapay.environment');

        $this->line('Environnement          : ' . ($env ?: '(vide → live)'));
        $this->line('Clé secrète            : ' . ($key ? 'présente (…' . substr($key, -4) . ')' : '<error>ABSENTE</error>'));
        $this->line('Webhook secret         : ' . (config('services.fedapay.webhook_secret') ? 'présent' : '<comment>absent (le suivi passera par la vérification planifiée)</comment>'));
        $this->line('Retrait minimum        : ' . config('services.fedapay.min_withdrawal', '(config en cache ?)'));
        foreach (['mtn', 'moov', 'celtis'] as $m) {
            $this->line("Mode {$m}" . str_repeat(' ', 17 - strlen($m)) . ': ' . (config("services.fedapay.payout_modes.{$m}") ?: '<comment>non défini (valeur par défaut utilisée)</comment>'));
        }

        if (!$key) {
            $this->error("Aucune clé : vérifiez FEDAPAY_LIVE_SECRET_KEY dans .env puis lancez « php artisan config:clear ».");
            return self::FAILURE;
        }

        try {
            FedaPay::setApiKey($key);
            FedaPay::setEnvironment($env ?: 'live');
            \FedaPay\Customer::all(['per_page' => 1]);
            $this->info('API Fedapay : connexion et clé valides.');
        } catch (\Throwable $e) {
            $this->error('API Fedapay : ' . FedapayPayoutService::describeError($e));
            return self::FAILURE;
        }

        return self::SUCCESS;
    }
}

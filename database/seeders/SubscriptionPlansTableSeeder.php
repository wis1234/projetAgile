<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\SubscriptionPlan;

class SubscriptionPlansTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $plans = [
            [
                'name' => 'Abonnement Mensuel',
                'slug' => 'mensuel',
                'price' => 200,
                'duration_in_months' => 1,
                'description' => 'Accès complet à la plateforme pour un mois',
                'features' => json_encode([
                    'Accès à tous les projets',
                    'Gestion des tâches illimitées',
                    'Stockage de fichiers 10GB',
                    'Support prioritaire',
                    'Rapports mensuels',
                    'Export de données'
                ]),
                'is_active' => true,
            ],
            [
                'name' => 'Abonnement Annuel',
                'slug' => 'annuel',
                'price' => 1000,
                'duration_in_months' => 12,
                'description' => 'Accès complet à la plateforme pour une année (2 mois offerts)',
                'features' => json_encode([
                    'Toutes les fonctionnalités de l\'abonnement mensuel',
                    'Économisez 58% par rapport au mensuel',
                    'Stockage de fichiers 50GB',
                    'Support prioritaire 24/7',
                    'Rapports personnalisés',
                    'Export de données avancé',
                    'Accès aux nouvelles fonctionnalités en avant-première'
                ]),
                'is_active' => true,
            ],
        ];

        foreach ($plans as $plan) {
            SubscriptionPlan::updateOrCreate(
                ['slug' => $plan['slug']],
                $plan
            );
        }
    }
}

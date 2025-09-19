<?php

namespace Database\Seeders;

use App\Models\Subscription;
use App\Models\SubscriptionPlan;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class SubscriptionsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Vérifier s'il y a des utilisateurs et des plans
        if (User::count() === 0 || SubscriptionPlan::count() === 0) {
            $this->command->info('Veuillez d\'abord exécuter les seeders pour les utilisateurs et les plans d\'abonnement.');
            return;
        }

        $users = User::take(5)->get();
        $plans = SubscriptionPlan::all();
        
        if ($users->isEmpty() || $plans->isEmpty()) {
            $this->command->info('Pas assez d\'utilisateurs ou de plans pour créer des abonnements.');
            return;
        }

        $statuses = [
            Subscription::STATUS_ACTIVE,
            Subscription::STATUS_PENDING,
            Subscription::STATUS_CANCELLED,
            Subscription::STATUS_EXPIRED
        ];

        foreach ($users as $index => $user) {
            $plan = $plans->random();
            $startsAt = now()->subMonths(rand(1, 12));
            $endsAt = (clone $startsAt)->addMonths($plan->duration_in_months);
            
            $status = $statuses[array_rand($statuses)];
            
            // Si le statut est annulé, définir une date d'annulation aléatoire
            $cancelledAt = null;
            if ($status === Subscription::STATUS_CANCELLED) {
                $cancelledAt = $startsAt->copy()->addDays(rand(1, $plan->duration_in_months * 30 - 1));
            }
            
            // Si le statut est expiré, s'assurer que la date de fin est dans le passé
            if ($status === Subscription::STATUS_EXPIRED) {
                $endsAt = now()->subDays(rand(1, 30));
            }
            
            // Si le statut est actif, s'assurer que la date de fin est dans le futur
            if ($status === Subscription::STATUS_ACTIVE) {
                $endsAt = now()->addMonths(rand(1, $plan->duration_in_months));
            }
            
            Subscription::create([
                'user_id' => $user->id,
                'subscription_plan_id' => $plan->id,
                'status' => $status,
                'starts_at' => $startsAt,
                'ends_at' => $endsAt,
                'cancelled_at' => $cancelledAt,
                'payment_method' => ['feda', 'card', 'mobile_money'][array_rand(['feda', 'card', 'mobile_money'])],
                'amount_paid' => $plan->price,
                'currency' => 'XOF',
                'payment_details' => [
                    'transaction_id' => 'TXN' . strtoupper(uniqid()),
                    'payment_method' => ['feda', 'card', 'mobile_money'][array_rand(['feda', 'card', 'mobile_money'])],
                    'status' => $status === 'pending' ? 'pending' : 'succeeded',
                ],
                'is_renewal' => $index > 0 && rand(0, 1),
            ]);
        }
        
        $this->command->info('Abonnements de test créés avec succès.');
    }
}

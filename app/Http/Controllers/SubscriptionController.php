<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class SubscriptionController extends Controller
{
    /**
     * Affiche la page de gestion des abonnements (admin)
     */
    public function manage()
    {
        // Récupérer tous les abonnements avec les utilisateurs et les plans associés
        $subscriptions = \App\Models\Subscription::with(['user' => function($query) {
            $query->select('id', 'name', 'email', 'profile_photo_path');
        }, 'plan'])->latest()->get()->map(function($subscription) {
            $interval = 'month';
            if ($subscription->plan) {
                $interval = $subscription->plan->duration_in_months >= 12 ? 'year' : 'month';
            }
            
            return [
                'id' => $subscription->id,
                'user' => $subscription->user,
                'plan_name' => $subscription->plan ? $subscription->plan->name : 'Plan inconnu',
                'amount' => $subscription->amount_paid ?? 0,
                'status' => $subscription->status,
                'interval' => $interval,
                'starts_at' => $subscription->starts_at,
                'ends_at' => $subscription->ends_at,
                'created_at' => $subscription->created_at,
                'updated_at' => $subscription->updated_at,
            ];
        });

        // Calculer les statistiques
        $now = now();
        $endOfMonth = now()->endOfMonth();
        
        // Calcul du revenu mensuel récurrent (abonnements mensuels actifs)
        $monthlyRevenue = \App\Models\Subscription::where('status', 'active')
            ->join('subscription_plans', 'subscriptions.subscription_plan_id', '=', 'subscription_plans.id')
            ->where('subscription_plans.duration_in_months', 1)
            ->sum('subscriptions.amount_paid');
            
        // Calcul du revenu annuel récurrent (divisé par 12 pour le mensuel)
        $yearlyRevenue = \App\Models\Subscription::where('status', 'active')
            ->join('subscription_plans', 'subscriptions.subscription_plan_id', '=', 'subscription_plans.id')
            ->where('subscription_plans.duration_in_months', 12)
            ->sum('subscriptions.amount_paid') / 12;
        
        $stats = [
            'active_subscriptions' => \App\Models\Subscription::where('status', 'active')->count(),
            'expiring_this_month' => \App\Models\Subscription::where('status', 'active')
                ->where('ends_at', '>=', $now)
                ->where('ends_at', '<=', $endOfMonth)
                ->count(),
            'monthly_recurring_revenue' => $monthlyRevenue + $yearlyRevenue,
            'active_plans' => \App\Models\SubscriptionPlan::where('is_active', true)->count(),
        ];

        return Inertia::render('Subscriptions/Manage', [
            'subscriptions' => $subscriptions,
            'stats' => $stats,
            'filters' => request()->only(['search', 'status'])
        ]);
    }

    /**
     * Affiche la page de choix d'abonnement
     */
    public function index()
    {
        $plans = \App\Models\SubscriptionPlan::where('is_active', true)
            ->get()
            ->map(function($plan) {
                return [
                    'id' => $plan->id,
                    'name' => $plan->name,
                    'slug' => $plan->slug,
                    'price' => (float)$plan->price,
                    'formatted_price' => number_format($plan->price, 0, ',', ' ') . ' FCFA',
                    'period' => $plan->duration_in_months == 1 ? 'par mois' : 'par an',
                    'duration_in_months' => $plan->duration_in_months,
                    'description' => $plan->description,
                    'features' => $plan->features,
                    'is_popular' => $plan->slug === 'etudiant',
                    'is_current' => false // À implémenter la logique pour vérifier l'abonnement actuel
                ];
            });

        return Inertia::render('Subscriptions/Index', [
            'plans' => $plans
        ]);
    }

    /**
     * Affiche la page de paiement pour un plan
     */
    public function checkout($id)
    {
        $plan = $this->getPlanById($id);
        
        if (!$plan) {
            return redirect()->route('subscription.plans')
                ->with('error', 'Plan non trouvé.');
        }
        
        // Récupérer les méthodes de paiement disponibles
        $paymentMethods = [
            [
                'id' => 'card',
                'name' => 'Carte bancaire',
                'icon' => 'credit-card',
                'description' => 'Paiement sécurisé par carte de crédit ou de débit',
            ],
            [
                'id' => 'orange_money',
                'name' => 'Orange Money',
                'icon' => 'mobile-alt',
                'description' => 'Paiement via Orange Money',
            ],
            [
                'id' => 'mtn_money',
                'name' => 'MTN Mobile Money',
                'icon' => 'mobile-alt',
                'description' => 'Paiement via MTN Mobile Money',
            ],
        ];
        
        return Inertia::render('Subscriptions/Checkout', [
            'plan' => $plan,
            'paymentMethods' => $paymentMethods,
        ]);
    }
    
    /**
     * Traite la souscription à un plan
     */
    public function subscribe(Request $request, $id)
    {
        $plan = $this->getPlanById($id);
        
        if (!$plan) {
            return redirect()->route('subscription.plans')
                ->with('error', 'Plan non trouvé.');
        }
        
        // Récupérer l'utilisateur connecté
        $user = auth()->user();
        
        try {
            // Initialiser FedaPay
            \FedaPay\FedaPay::setApiKey(config('services.fedapay.secret_key'));
            \FedaPay\FedaPay::setEnvironment('live'); // ou 'sandbox' pour les tests
            
            // Créer une transaction FedaPay
            $transaction = \FedaPay\Transaction::create([
                'description' => 'Abonnement ' . $plan['name'],
                'amount' => $plan['price'],
                'currency' => [
                    'iso' => 'XOF'
                ],
                'callback_url' => route('subscription.success'),
                'customer' => [
                    'firstname' => $user->first_name ?? $user->name,
                    'lastname' => $user->last_name ?? '',
                    'email' => $user->email,
                    'phone_number' => [
                        'number' => $request->phone_number ?? '00000000',
                        'country' => 'bj' // Code pays pour le Bénin
                    ]
                ]
            ]);
            
            // Générer le token de paiement
            $token = $transaction->generateToken();
            
            // Retourner le token dans une réponse JSON
            return response()->json([
                'success' => true,
                'token' => $token->token,
                'url' => $token->url
            ]);
            
        } catch (\Exception $e) {
            return redirect()->back()
                ->with('error', 'Une erreur est survenue lors du traitement de votre paiement : ' . $e->getMessage());
        }
    }
    
    /**
     * Récupère les détails d'un plan par son ID
     */
    private function getPlanById($id)
    {
        $plan = \App\Models\SubscriptionPlan::find($id);
        
        if (!$plan || !$plan->is_active) {
            return null;
        }
        
        return [
            'id' => $plan->id,
            'name' => $plan->name,
            'slug' => $plan->slug,
            'price' => (float)$plan->price,
            'formatted_price' => number_format($plan->price, 0, ',', ' ') . ' FCFA',
            'duration_in_months' => $plan->duration_in_months,
            'period' => $plan->duration_in_months == 1 ? 'par mois' : 'par an',
            'description' => $plan->description,
            'features' => $plan->features,
            'is_popular' => $plan->slug === 'etudiant',
            'is_current' => false // À implémenter la logique pour vérifier l'abonnement actuel
        ];
    }

    /**
     * Affiche la page de succès après un paiement réussi
     */
    public function success(Request $request)
    {
        $transactionId = $request->query('transaction_id');
        $status = $request->query('status');
        $planId = $request->query('plan_id');
        
        if (!$transactionId) {
            return redirect()->route('subscription.plans')
                ->with('error', 'Aucun identifiant de transaction fourni.');
        }
        
        try {
            $subscription = null;
            
            // Vérifier si la transaction existe déjà
            $subscription = \App\Models\Subscription::where('payment_id', $transactionId)->first();
            
            if ($subscription) {
                // Mettre à jour le statut de l'utilisateur si le paiement est réussi
                if ($status === 'approved') {
                    $user = auth()->user();
                    if ($user) {
                        // Calculer la date de fin en fonction de la durée du plan
                        $plan = \App\Models\SubscriptionPlan::find($subscription->subscription_plan_id);
                        $endsAt = $plan ? now()->addMonths($plan->duration_in_months) : now()->addMonth();
                        
                        $user->update([
                            'subscription_status' => 'active',
                            'subscription_ends_at' => $endsAt,
                        ]);
                        
                        // Mettre à jour l'abonnement
                        $subscription->update([
                            'status' => 'active',
                            'starts_at' => now(),
                            'ends_at' => $endsAt,
                        ]);
                    }
                }
                
                // Journaliser le statut de la transaction
                \Log::info("Statut de la transaction $transactionId: $status", [
                    'subscription_id' => $subscription->id,
                    'user_id' => auth()->id(),
                    'plan_id' => $planId,
                    'status' => $status
                ]);
                
                // Si le paiement a échoué, rediriger avec un message d'erreur
                if ($status !== 'approved') {
                    return redirect()->route('subscription.plans')
                        ->with('error', "Le paiement a échoué. Statut: " . ucfirst($status));
                }
            } else {
                // Si la transaction n'existe pas
                \Log::error("Transaction non trouvée: $transactionId");
                return redirect()->route('subscription.plans')
                    ->with('error', 'Transaction introuvable. Veuillez contacter le support.');
            }
        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
            \Log::error("Erreur lors du traitement de la transaction $transactionId: " . $errorMessage);
            
            // Enregistrer quand même l'échec dans la base de données
            try {
                \App\Models\Subscription::create([
                    'user_id' => auth()->id(),
                    'subscription_plan_id' => $planId,
                    'status' => 'error',
                    'payment_id' => $transactionId ?? 'unknown_' . uniqid(),
                    'payment_method' => 'unknown',
                    'currency' => 'XOF',
                    'payment_details' => ['error' => $errorMessage],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            } catch (\Exception $dbError) {
                \Log::error('Échec de l\'enregistrement de l\'erreur dans la base de données: ' . $dbError->getMessage());
            }
            
            return redirect()->route('subscription.plans')
                ->with('error', 'Une erreur est survenue lors du traitement de votre paiement. Veuillez réessayer ou contacter le support.');
        }
        
        // Récupérer les informations du plan pour l'affichage
        $plan = null;
        if ($subscription && $subscription->subscription_plan_id) {
            $plan = \App\Models\SubscriptionPlan::find($subscription->subscription_plan_id);
        }
        
        // Préparer les données pour la vue Inertia
        $subscriptionData = [
            'id' => $subscription->id,
            'starts_at' => $subscription->starts_at,
            'ends_at' => $subscription->ends_at,
            'amount_paid' => $subscription->amount_paid,
            'status' => $subscription->status,
            'plan' => null
        ];
        
        if ($plan) {
            $subscriptionData['plan'] = [
                'id' => $plan->id,
                'name' => $plan->name,
                'description' => $plan->description ?? '',
                'price' => $plan->price,
                'duration_in_months' => $plan->duration_in_months,
                'features' => $plan->features ?? []
            ];
        }
        
        return Inertia::render('Subscriptions/Success', [
            'subscription' => $subscriptionData
        ]);
    }
}
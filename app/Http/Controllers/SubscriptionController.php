<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Jobs\VerifyFedapayTransaction;

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
        // Récupérer l'utilisateur connecté
        $user = auth()->user();
        $currentSubscription = null;

        // Récupérer l'abonnement actif de l'utilisateur s'il en a un
        if ($user) {
            $currentSubscription = \App\Models\Subscription::with('plan')
                ->where('user_id', $user->id)
                ->where(function($query) {
                    $query->where('status', 'active')
                          ->orWhere('status', 'pending');
                })
                ->latest()
                ->first();
        }

        $plans = \App\Models\SubscriptionPlan::where('is_active', true)
            ->get()
            ->map(function($plan) use ($currentSubscription) {
                $isCurrent = $currentSubscription && $currentSubscription->plan_id === $plan->id;
                
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
                    'is_current' => $isCurrent
                ];
            });

        // Préparer les données de l'abonnement actuel pour la vue
        $currentSubscriptionData = null;
        if ($currentSubscription) {
            $currentSubscriptionData = [
                'id' => $currentSubscription->id,
                'plan_id' => $currentSubscription->plan_id,
                'plan_name' => $currentSubscription->plan ? $currentSubscription->plan->name : 'Inconnu',
                'status' => $currentSubscription->status,
                'starts_at' => $currentSubscription->starts_at,
                'ends_at' => $currentSubscription->ends_at,
                'amount_paid' => $currentSubscription->amount_paid,
                'payment_method' => $currentSubscription->payment_method,
                'created_at' => $currentSubscription->created_at,
                'updated_at' => $currentSubscription->updated_at,
                'is_active' => $currentSubscription->status === 'active',
                'is_pending' => $currentSubscription->status === 'pending',
                'is_expired' => $currentSubscription->ends_at && $currentSubscription->ends_at->isPast(),
                'days_remaining' => $currentSubscription->ends_at ? now()->diffInDays($currentSubscription->ends_at, false) : null
            ];
        }

        return Inertia::render('Subscriptions/Index', [
            'plans' => $plans,
            'currentPlan' => $currentSubscriptionData
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
            
            // Créer l'abonnement avec le statut 'pending' initialement
            $subscription = new \App\Models\Subscription([
                'user_id' => $user->id,
                'subscription_plan_id' => $plan->id,
                'starts_at' => now(),
                'ends_at' => now()->addMonths($plan->duration_in_months),
                'amount_paid' => $plan->price,
                'status' => 'pending', // Statut initial
                'payment_method' => $request->payment_method,
                'transaction_id' => $transaction->id ?? null,
                'metadata' => [
                    'attempted_at' => now(),
                    'ip_address' => $request->ip(),
                    'user_agent' => $request->userAgent()
                ]
            ]);
            
            // Sauvegarder l'abonnement avant le paiement
            $subscription->save();
            
            // Générer le token de paiement
            $token = $transaction->generateToken();
            
            // Mettre à jour l'abonnement avec les informations de la transaction
            $subscription->update([
                'transaction_id' => $transaction->id,
                'status' => 'pending', // Le statut reste en attente jusqu'à confirmation
                'metadata' => array_merge($subscription->metadata ?? [], [
                    'payment_initiated_at' => now(),
                    'payment_token' => $token->token
                ])
            ]);

            // Retourner le token dans une réponse JSON
            return response()->json([
                'token' => $token->token,
                'url' => $token->url,
                'subscription_id' => $subscription->id
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
        $status = $request->query('status', 'pending');
        $planId = $request->query('plan_id');
        $subscriptionId = $request->query('subscription_id');
        
        // Si aucune transaction ID n'est fournie, vérifier si on a un ID d'abonnement
        if (!$transactionId && !$subscriptionId) {
            // Essayer de trouver l'abonnement le plus récent pour l'utilisateur connecté
            $subscription = \App\Models\Subscription::where('user_id', auth()->id())
                ->latest()
                ->first();
                
            if ($subscription) {
                $subscriptionId = $subscription->id;
            } else {
                return redirect()->route('subscription.plans')
                    ->with('error', 'Aucun identifiant de transaction ou d\'abonnement fourni.');
            }
        }
        
        try {
            // Essayer de trouver l'abonnement par ID ou par ID de transaction
            $subscription = $subscriptionId 
                ? \App\Models\Subscription::find($subscriptionId)
                : \App\Models\Subscription::where('payment_id', $transactionId)->first();
            
            // Si l'abonnement n'existe pas, en créer un nouveau en attente
            if (!$subscription) {
                $subscription = new \App\Models\Subscription([
                    'user_id' => auth()->id(),
                    'subscription_plan_id' => $planId,
                    'payment_id' => $transactionId,
                    'status' => 'pending',
                    'starts_at' => now(),
                    'ends_at' => now()->addMonth(), // Par défaut 1 mois, sera mis à jour par le webhook
                    'amount_paid' => 0,
                    'payment_method' => $request->query('payment_method', 'unknown'),
                    'metadata' => [
                        'created_via' => 'success_callback',
                        'callback_data' => $request->all()
                    ]
                ]);
                $subscription->save();
            }
            
            // Vérifier si nous devons vérifier le statut de la transaction
            if ($subscription->status === 'pending' && $transactionId) {
                // Planifier un job pour vérifier le statut de la transaction
                VerifyFedapayTransaction::dispatch($subscription, $transactionId)
                    ->delay(now()->addSeconds(30));
            }
            
            // Récupérer les informations du plan pour l'affichage
            $plan = null;
            if ($subscription->subscription_plan_id) {
                $plan = \App\Models\SubscriptionPlan::find($subscription->subscription_plan_id);
            }
            
            // Préparer les données pour la vue Inertia
            $subscriptionData = [
                'id' => $subscription->id,
                'status' => $subscription->status,
                'isPending' => $subscription->status === 'pending',
                'transaction_id' => $transactionId,
                'starts_at' => $subscription->starts_at,
                'ends_at' => $subscription->ends_at,
                'amount_paid' => $subscription->amount_paid,
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
            
        } catch (\Exception $e) {
            $errorMessage = $e->getMessage();
            \Log::error("Erreur lors du traitement de la transaction $transactionId: " . $errorMessage);
            
            // Enregistrer l'échec dans la base de données
            try {
                $subscription = \App\Models\Subscription::updateOrCreate(
                    ['payment_id' => $transactionId ?? 'unknown_' . uniqid()],
                    [
                        'user_id' => auth()->id(),
                        'subscription_plan_id' => $planId,
                        'status' => 'error',
                        'payment_method' => 'unknown',
                        'currency' => 'XOF',
                        'payment_details' => ['error' => $errorMessage],
                        'starts_at' => now(),
                        'ends_at' => now(),
                        'metadata' => [
                            'error' => $errorMessage,
                            'trace' => $e->getTraceAsString()
                        ]
                    ]
                );
                
                return redirect()->route('subscription.plans')
                    ->with('error', 'Une erreur est survenue lors du traitement de votre paiement. Veuillez réessayer ou contacter le support.');
                    
            } catch (\Exception $dbError) {
                \Log::error('Échec de l\'enregistrement de l\'erreur dans la base de données: ' . $dbError->getMessage());
                
                return redirect()->route('subscription.plans')
                    ->with('error', 'Une erreur critique est survenue. Veuillez contacter le support.');
            }
        }
        
        return Inertia::render('Subscriptions/Success', [
            'subscription' => $subscriptionData
        ]);
    }
    
    /**
     * Affiche le contenu de la table subscriptions (pour débogage)
     */
    public function debugSubscriptions()
    {
        try {
            // Vérifier si la table existe
            if (!\Schema::hasTable('subscriptions')) {
                return response()->json([
                    'error' => 'La table subscriptions n\'existe pas',
                    'tables' => \Schema::getAllTables()
                ], 500);
            }
            
            // Récupérer les abonnements
            $subscriptions = \DB::table('subscriptions')->get();
            
            // Vérifier les colonnes de la table
            $columns = \Schema::getColumnListing('subscriptions');
            
            // Vérifier les contraintes de validation du modèle
            $subscription = new \App\Models\Subscription();
            $rules = method_exists($subscription, 'rules') ? $subscription->rules() : [];
            
            return response()->json([
                'count' => $subscriptions->count(),
                'subscriptions' => $subscriptions,
                'columns' => $columns,
                'validation_rules' => $rules,
                'db_connection' => \DB::connection()->getDatabaseName(),
                'table_exists' => \Schema::hasTable('subscriptions'),
                'migrations' => \DB::table('migrations')->where('migration', 'like', '%subscription%')->get()
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'connection' => config('database.default'),
                'database' => config('database.connections.' . config('database.default') . '.database')
            ], 500);
        }
    }
    
    /**
     * Affiche la page de facturation de l'utilisateur
     *
     * @return \Inertia\Response
     */
    public function billing()
    {
        $user = auth()->user();
        
        // Récupérer l'abonnement actif de l'utilisateur
        $subscription = $user->subscriptions()
            ->with(['plan'])
            ->latest()
            ->first();
        
        // Formater les données de l'abonnement pour la vue
        $subscriptionData = null;
        if ($subscription) {
            $subscriptionData = [
                'id' => $subscription->id,
                'plan_name' => $subscription->plan ? $subscription->plan->name : 'Forfait personnalisé',
                'amount' => $subscription->amount_paid ?? 0,
                'status' => $subscription->status,
                'interval' => $subscription->plan && $subscription->plan->duration_in_months >= 12 ? 'year' : 'month',
                'starts_at' => $subscription->starts_at ? $subscription->starts_at->toDateTimeString() : null,
                'ends_at' => $subscription->ends_at ? $subscription->ends_at->toDateTimeString() : null,
                'created_at' => $subscription->created_at->toDateTimeString(),
                'updated_at' => $subscription->updated_at->toDateTimeString(),
            ];
        }
        
        // Récupérer l'historique des factures (exemple avec des données factices)
        // Dans une application réelle, vous récupéreriez cela depuis votre système de facturation
        $invoices = [];
        
        // Récupérer les méthodes de paiement enregistrées (exemple avec des données factices)
        // Dans une application réelle, vous utiliseriez l'API de votre processeur de paiement
        $paymentMethods = [];
        
        // Exemple de données factices pour le développement
        if (app()->environment('local')) {
            $invoices = [
                [
                    'id' => 'in_123456789',
                    'number' => 'INV-2023-001',
                    'date' => now()->subDays(30)->toDateTimeString(),
                    'amount' => 10000,
                    'currency' => 'XOF',
                    'paid' => true,
                    'invoice_pdf' => '#'
                ],
                [
                    'id' => 'in_987654321',
                    'number' => 'INV-2023-002',
                    'date' => now()->subDays(60)->toDateTimeString(),
                    'amount' => 10000,
                    'currency' => 'XOF',
                    'paid' => true,
                    'invoice_pdf' => '#'
                ]
            ];
            
            $paymentMethods = [
                [
                    'id' => 'pm_123456789',
                    'brand' => 'visa',
                    'last4' => '4242',
                    'exp_month' => 12,
                    'exp_year' => 2025,
                    'is_default' => true
                ]
            ];
        }
        
        return Inertia::render('Settings/Billing', [
            'subscription' => $subscriptionData,
            'invoices' => $invoices,
            'paymentMethods' => $paymentMethods,
        ]);
    }
}
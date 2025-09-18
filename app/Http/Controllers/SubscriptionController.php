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
        // Récupérer tous les abonnements avec les utilisateurs associés
        $subscriptions = \App\Models\Subscription::with(['user' => function($query) {
            $query->select('id', 'name', 'email');
        }])->latest()->get()->map(function($subscription) {
            return [
                'id' => $subscription->id,
                'user' => $subscription->user,
                'plan_name' => $subscription->name,
                'amount' => $subscription->stripe_price ? $subscription->stripe_price / 100 : 0,
                'status' => $subscription->stripe_status,
                'interval' => $subscription->stripe_plan ? 'month' : 'year', // À adapter selon votre logique
                'starts_at' => $subscription->created_at,
                'ends_at' => $subscription->ends_at,
                'created_at' => $subscription->created_at,
                'updated_at' => $subscription->updated_at,
            ];
        });

        return Inertia::render('Subscriptions/Manage', [
            'subscriptions' => $subscriptions,
        ]);
    }

    /**
     * Affiche la page de choix d'abonnement
     */
    public function index()
    {
        return Inertia::render('Subscriptions/Index', [
            'plans' => [
                [
                    'id' => 1,
                    'name' => 'Basique',
                    'price' => 300,
                    'period' => 'par mois',
                    'features' => ['Projets illimités', 'Jusqu\'à 5 membres par projet', 'Stockage de base'],
                    'is_popular' => true,
                ],
                [
                    'id' => 2,
                    'name' => 'Étudiant',
                    'price' => 2000,
                    'period' => 'par an',
                    'features' => ['Tout dans le plan Basique', 'Jusqu\'à 20 membres par projet', 'Stockage étendu', 'Support prioritaire'],
                    'is_current' => true,
                ],
                [
                    'id' => 3,
                    'name' => 'Startup',
                    'price' => 50000,
                    'period' => 'par an',
                    'features' => ['Tout dans l\'offre Étudiant', 'Membres illimités', 'Stockage illimité', 'Support 24/7', 'SSO', 'Formation gratuite'],
                ],
            ],
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
        
        // Les données d'authentification sont déjà partagées via le middleware HandleInertiaRequests
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
        $plans = [
            [
                'id' => 1,
                'name' => 'Basique',
                'slug' => 'basique',
                'price' => 300,
                'formatted_price' => '300 FCFA',
                'duration_in_months' => 1,
                'description' => 'Parfait pour les petits projets',
                'features' => ['Jusqu\'à 5 projets par mois', 'Jusqu\'à 5 membres par projet', 'Stockage de base'],
                'is_current' => true,
            ],
            [
                'id' => 2,
                'name' => 'Étudiant',
                'slug' => 'etudiant',
                'price' => 1000, // 1000 FCFA
                'formatted_price' => '1000 FCFA',
                'duration_in_months' => 12,
                'description' => 'Idéal pour les étudiants',
                'features' => ['Tout dans le plan basique', 'Jusqu\'à 20 membres par projet', 'Stockage étendu', 'Support prioritaire'],
                'is_popular' => true,
            ],
            [
                'id' => 3,
                'name' => 'Entreprise',
                'slug' => 'entreprise',
                'price' => 20000, // 20000 FCFA
                'formatted_price' => '20000 FCFA',
                'duration_in_months' => 1,
                'description' => 'Pour les entreprises avec des besoins avancés',
                'features' => ['Tout dans le professionnel', 'Membres illimités', 'Stockage illimité', 'Support 24/7', 'SSO'],
            ],
        ];
        
        foreach ($plans as $plan) {
            if ($plan['id'] == $id) {
                return $plan;
            }
        }
        
        return null;
    }

    /**
     * Affiche la page de succès après souscription
     */
    public function success()
    {
        return Inertia::render('Subscriptions/Success');
    }
}

<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use App\Notifications\SubscriptionStatusUpdated;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;

class SubscriptionPlanController extends Controller
{
    /**
     * Affiche la liste des plans d'abonnement
     */
    public function index(Request $request)
    {
        // Récupérer les filtres de la requête
        $filters = $request->only(['search', 'status']);
        
        // Construire la requête avec les filtres
        $query = SubscriptionPlan::query();
        
        // Appliquer le filtre de recherche
        if (!empty($filters['search'])) {
            $query->where('name', 'like', '%' . $filters['search'] . '%')
                  ->orWhere('description', 'like', '%' . $filters['search'] . '%');
        }
        
        // Appliquer le filtre de statut
        if (!empty($filters['status']) && $filters['status'] !== 'all') {
            $query->where('is_active', $filters['status'] === 'active');
        }
        
        $plans = $query->latest()->paginate(15);
        
        // Calculer les statistiques complètes
        $totalPlans = SubscriptionPlan::count();
        $activePlans = SubscriptionPlan::where('is_active', true)->count();
        $inactivePlans = $totalPlans - $activePlans;
        
        $totalSubscriptions = Subscription::count();
        $activeSubscriptions = Subscription::where('status', 'active')->count();
        $expiringThisMonth = Subscription::where('status', 'active')
            ->where('ends_at', '>=', now())
            ->where('ends_at', '<=', now()->endOfMonth())
            ->count();
        $expiredSubscriptions = Subscription::where('status', 'expired')->count();
        
        $monthlyRecurringRevenue = Subscription::where('status', 'active')
            ->join('subscription_plans', 'subscriptions.subscription_plan_id', '=', 'subscription_plans.id')
            ->sum('subscription_plans.price');
            
        $totalRevenue = Subscription::join('subscription_plans', 'subscriptions.subscription_plan_id', '=', 'subscription_plans.id')
            ->sum('subscription_plans.price');
            
        // Trouver le plan le plus populaire
        $mostPopularPlan = Subscription::selectRaw('subscription_plan_id, count(*) as subscription_count')
            ->groupBy('subscription_plan_id')
            ->with('plan')
            ->orderByDesc('subscription_count')
            ->first();
            
        // Calculer le taux de croissance (exemple simplifié)
        $lastMonthSubscriptions = Subscription::where('created_at', '>=', now()->subMonth())->count();
        $previousMonthSubscriptions = Subscription::whereBetween('created_at', [now()->subMonths(2), now()->subMonth()])->count();
        $subscriptionGrowthRate = $previousMonthSubscriptions > 0 
            ? (($lastMonthSubscriptions - $previousMonthSubscriptions) / $previousMonthSubscriptions) * 100 
            : ($lastMonthSubscriptions > 0 ? 100 : 0);
            
        // Taux de renouvellement (utilise created_at comme approximation)
        $renewedSubscriptions = Subscription::where('status', 'active')
            ->where('created_at', '>=', now()->subMonth())
            ->count();
        $renewalRate = $activeSubscriptions > 0 
            ? ($renewedSubscriptions / $activeSubscriptions) * 100 
            : 0;
            
        // Revenu moyen par utilisateur
        $averageRevenuePerUser = $activeSubscriptions > 0 
            ? $monthlyRecurringRevenue / $activeSubscriptions 
            : 0;
        
        $stats = [
            // Statistiques principales
            'total_plans' => $totalPlans,
            'active_plans' => $activePlans,
            'inactive_plans' => $inactivePlans,
            
            // Statistiques des abonnements
            'total_subscriptions' => $totalSubscriptions,
            'active_subscriptions' => $activeSubscriptions,
            'expiring_this_month' => $expiringThisMonth,
            'expired_subscriptions' => $expiredSubscriptions,
            
            // Statistiques financières
            'monthly_recurring_revenue' => $monthlyRecurringRevenue,
            'total_revenue' => $totalRevenue,
            'average_revenue_per_user' => $averageRevenuePerUser,
            
            // Statistiques d'engagement
            'most_popular_plan' => $mostPopularPlan ? [
                'id' => $mostPopularPlan->plan->id,
                'name' => $mostPopularPlan->plan->name,
                'price' => $mostPopularPlan->plan->price,
                'duration_in_months' => $mostPopularPlan->plan->duration_in_months,
                'subscriptions_count' => $mostPopularPlan->subscription_count
            ] : null,
            'subscription_growth_rate' => $subscriptionGrowthRate,
            'renewal_rate' => $renewalRate,
        ];
        
        // Retourner directement la pagination
        return Inertia::render('Admin/SubscriptionPlans/Index', [
            'plans' => $plans->toArray(),
            'stats' => $stats,
            'filters' => $filters
        ]);
    }

    /**
     * Affiche le formulaire de création d'un plan
     */
    public function create()
    {
        return Inertia::render('Admin/SubscriptionPlans/Create');
    }

    /**
     * Enregistre un nouveau plan d'abonnement
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'duration_in_months' => 'required|integer|min:1',
            'features' => 'required|array',
            'features.*' => 'string',
            'is_active' => 'boolean',
        ]);

        // Générer un slug à partir du nom
        $validated['slug'] = Str::slug($validated['name']);
        $validated['features'] = json_encode($validated['features']);

        SubscriptionPlan::create($validated);

        return redirect()->route('admin.subscription-plans.index')
            ->with('success', 'Plan d\'abonnement créé avec succès.');
    }

    /**
     * Affiche le formulaire d'édition d'un plan
     */
    public function edit(SubscriptionPlan $subscriptionPlan)
    {
        return Inertia::render('Admin/SubscriptionPlans/Edit', [
            'plan' => $subscriptionPlan,
        ]);
    }

    /**
     * Met à jour un plan d'abonnement
     */
    public function update(Request $request, SubscriptionPlan $subscriptionPlan)
    {
        // Démarrer une transaction de base de données
        \DB::beginTransaction();
        
        try {
            // Valider les données de base
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'required|numeric|min:0',
                'duration_in_months' => 'required|integer|min:1',
                'features' => 'required|array',
                'features.*' => 'nullable|string', // Permettre les valeurs nulles
                'is_active' => 'boolean',
            ]);

            // Mettre à jour le slug si le nom a changé
            if ($subscriptionPlan->name !== $validated['name']) {
                $validated['slug'] = Str::slug($validated['name']);
            }
            
            // Nettoyer les fonctionnalités
            $features = array_values(
                array_filter(
                    array_map('trim', $validated['features']),
                    function($value) {
                        return $value !== '' && $value !== null;
                    }
                )
            );
            
            // S'assurer qu'il y a au moins une fonctionnalité
            if (empty($features)) {
                $features = [''];
            }
            
            // Mettre à jour le modèle avec les données validées
            $subscriptionPlan->name = $validated['name'];
            $subscriptionPlan->description = $validated['description'] ?? null;
            $subscriptionPlan->price = $validated['price'];
            $subscriptionPlan->duration_in_months = $validated['duration_in_months'];
            $subscriptionPlan->features = $features;
            $subscriptionPlan->is_active = $validated['is_active'] ?? false;
            
            if (isset($validated['slug'])) {
                $subscriptionPlan->slug = $validated['slug'];
            }
            
            // Sauvegarder les modifications
            $saved = $subscriptionPlan->save();
            
            if (!$saved) {
                throw new \Exception('Échec de la sauvegarde du plan d\'abonnement');
            }
            
            // Valider la transaction
            \DB::commit();
            
            return redirect()->route('admin.subscription-plans.index')
                ->with('success', 'Plan d\'abonnement mis à jour avec succès.');
                
        } catch (\Exception $e) {
            // Annuler la transaction en cas d'erreur
            \DB::rollBack();
            
            \Log::error('Erreur lors de la mise à jour du plan d\'abonnement: ' . $e->getMessage(), [
                'exception' => $e,
                'plan_id' => $subscriptionPlan->id,
                'data' => $request->all()
            ]);
            
            return back()->withInput()
                ->with('error', 'Une erreur est survenue lors de la mise à jour du plan: ' . $e->getMessage());
        }
    }

    /**
     * Supprime un plan d'abonnement
     */
    public function destroy(SubscriptionPlan $subscriptionPlan)
    {
        // Vérifier si le plan est utilisé par des abonnements actifs
        if ($subscriptionPlan->subscriptions()->exists()) {
            return redirect()->back()
                ->with('error', 'Impossible de supprimer ce plan car il est utilisé par des abonnements actifs.');
        }

        $subscriptionPlan->delete();

        return redirect()->route('admin.subscription-plans.index')
            ->with('success', 'Plan d\'abonnement supprimé avec succès.');
    }

    /**
     * Affiche la liste des abonnés à un plan d'abonnement
     */
    /**
     * Met à jour le statut d'un abonnement
     */
    public function updateStatus(Request $request, $subscription_id)
    {
        $validated = $request->validate([
            'status' => 'required|in:active,pending,cancelled,expired',
        ]);

        try {
            // Trouver l'abonnement par son ID avec les relations nécessaires
            $subscription = Subscription::with(['user', 'plan'])->findOrFail($subscription_id);
            
            // Sauvegarder l'ancien statut pour la notification
            $oldStatus = $subscription->status;
            
            // Mettre à jour le statut de l'abonnement
            $subscription->update([
                'status' => $validated['status'],
                'cancelled_at' => $validated['status'] === 'cancelled' ? now() : null,
                'ends_at' => $validated['status'] === 'cancelled' || $validated['status'] === 'expired' ? now() : $subscription->ends_at
            ]);
            
            // Recharger le modèle avec les relations mises à jour
            $subscription->refresh();
            
            // Envoyer une notification par email uniquement si le statut a changé
            if ($oldStatus !== $subscription->status && $subscription->user) {
                try {
                    // Envoyer la notification
                    $subscription->user->notify(new SubscriptionStatusUpdated($subscription, $oldStatus));
                } catch (\Exception $e) {
                    // Enregistrer l'erreur mais ne pas interrompre le flux
                    \Log::error('Erreur lors de l\'envoi de la notification de changement de statut: ' . $e->getMessage(), [
                        'subscription_id' => $subscription->id,
                        'user_id' => $subscription->user->id,
                        'error' => $e->getTraceAsString()
                    ]);
                }
            }

            // Rediriger vers la page précédente avec un message de succès
            return back()->with('success', 'Le statut de l\'abonnement a été mis à jour avec succès.');
            
        } catch (\Exception $e) {
            \Log::error('Erreur lors de la mise à jour du statut de l\'abonnement: ' . $e->getMessage(), [
                'subscription_id' => $subscription_id,
                'status' => $validated['status'] ?? null,
                'error' => $e->getTraceAsString()
            ]);

            return back()->with('error', 'Une erreur est survenue lors de la mise à jour du statut: ' . $e->getMessage());
        }
    }

    /**
     * Affiche la liste des abonnés à un plan d'abonnement
     */
    public function subscribers(Request $request, $subscription_plan = null)
    {
        $query = \App\Models\Subscription::with(['user', 'plan']);
        $selectedPlan = null;
        $search = $request->input('search');
        $status = $request->input('status', 'all');
        
        // Filtrer par plan spécifique si fourni
        if ($subscription_plan) {
            $selectedPlan = SubscriptionPlan::findOrFail($subscription_plan);
            $query->where('subscription_plan_id', $subscription_plan);
        }
        
        // Recherche par nom d'utilisateur ou email
        if (!empty($search)) {
            $query->whereHas('user', function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        // Filtrer par statut
        if ($status !== 'all') {
            $query->where('status', $status);
        }
        
        $subscriptions = $query->latest()->paginate(15);
        $plans = SubscriptionPlan::all();
        
        // Format subscriptions data for Inertia
        $subscriptionsData = [
            'data' => $subscriptions->items(),
            'links' => [
                'first' => $subscriptions->url(1),
                'last' => $subscriptions->url($subscriptions->lastPage()),
                'prev' => $subscriptions->previousPageUrl(),
                'next' => $subscriptions->nextPageUrl(),
            ],
            'meta' => [
                'current_page' => $subscriptions->currentPage(),
                'from' => $subscriptions->firstItem(),
                'last_page' => $subscriptions->lastPage(),
                'path' => $subscriptions->path(),
                'per_page' => $subscriptions->perPage(),
                'to' => $subscriptions->lastItem(),
                'total' => $subscriptions->total(),
            ]
        ];

        return Inertia::render('Admin/SubscriptionPlans/Subscribers', [
            'subscriptions' => $subscriptionsData,
            'plans' => $plans,
            'selectedPlan' => $selectedPlan ? [
                'id' => $selectedPlan->id,
                'name' => $selectedPlan->name,
                'price' => $selectedPlan->price,
            ] : null,
            'filters' => [
                'search' => $search ?? '',
                'status' => $status,
            ]
        ]);
    }
}

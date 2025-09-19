<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\SubscriptionPlan;
use App\Models\Subscription;
use Illuminate\Http\Request;
use Inertia\Inertia;
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
        
        $plans = $query->latest()->get();
        
        // Calculer les statistiques
        $stats = [
            'active_subscriptions' => Subscription::where('status', 'active')->count(),
            'expiring_this_month' => Subscription::where('status', 'active')
                ->where('ends_at', '>=', now())
                ->where('ends_at', '<=', now()->endOfMonth())
                ->count(),
            'monthly_recurring_revenue' => Subscription::where('status', 'active')
                ->join('subscription_plans', 'subscriptions.subscription_plan_id', '=', 'subscription_plans.id')
                ->sum('subscription_plans.price'),
            'active_plans' => SubscriptionPlan::where('is_active', true)->count(),
        ];
        
        return Inertia::render('Admin/SubscriptionPlans/Index', [
            'plans' => $plans,
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
            // Valider les données
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'price' => 'required|numeric|min:0',
                'duration_in_months' => 'required|integer|min:1',
                'features' => 'required|array',
                'features.*' => 'string',
                'is_active' => 'boolean',
            ]);

            // Mettre à jour le slug si le nom a changé
            if ($subscriptionPlan->name !== $validated['name']) {
                $validated['slug'] = Str::slug($validated['name']);
            }
            
            // Nettoyer les fonctionnalités
            $validated['features'] = array_values(array_filter(array_map('trim', $validated['features'])));
            
            // S'assurer qu'il y a au moins une fonctionnalité
            if (empty($validated['features'])) {
                $validated['features'] = [''];
            }
            
            // Convertir en JSON pour le stockage
            $validated['features'] = json_encode($validated['features']);
            
            // Mettre à jour le modèle manuellement
            $subscriptionPlan->name = $validated['name'];
            $subscriptionPlan->description = $validated['description'] ?? null;
            $subscriptionPlan->price = $validated['price'];
            $subscriptionPlan->duration_in_months = $validated['duration_in_months'];
            $subscriptionPlan->features = $validated['features'];
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
}

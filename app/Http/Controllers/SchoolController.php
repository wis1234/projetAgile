<?php

namespace App\Http\Controllers;

use App\Models\School;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Illuminate\Support\Str;

class SchoolController extends Controller
{
    /**
     * Affiche la liste des établissements
     */
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $query = School::with(['createdBy:id,name', 'updatedBy:id,name']);
        
        // Filtrage par rôle
        if ($user->role === 'school_admin' && $user->school_id) {
            $query->where('id', $user->school_id);
        }
        
        // Filtres de recherche
        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('code', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }
        
        // Filtre par statut
        if ($request->has('status') && $request->status !== 'all') {
            $query->where('status', $request->status);
        }
        
        // Filtre par type
        if ($request->has('type') && $request->type !== 'all') {
            $query->where('type', $request->type);
        }
        
        // Tri
        $sortField = $request->input('sort', 'name');
        $sortDirection = $request->input('direction', 'asc');
        $query->orderBy($sortField, $sortDirection);
        
        $schools = $query->paginate(10)->withQueryString();
        
        return Inertia::render('Schools/Index', [
            'schools' => $schools,
            'filters' => $request->all(['search', 'status', 'type', 'sort', 'direction']),
        ]);
    }

    /**
     * Affiche le formulaire de création d'un établissement
     */
    public function create()
    {
        $this->authorize('create', School::class);
        
        return Inertia::render('Schools/Create', [
            'defaultValues' => [
                'type' => 'primary',
                'status' => 'active',
                'country' => 'Guinée',
            ]
        ]);
    }

    /**
     * Enregistre un nouvel établissement
     */
    public function store(Request $request)
    {
        $this->authorize('create', School::class);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'nullable|string|max:50|unique:schools,code',
            'type' => 'required|in:' . implode(',', array_keys(School::getTypeOptions())),
            'status' => 'required|in:' . implode(',', array_keys(School::getStatusOptions())),
            'description' => 'nullable|string',
            'address' => 'required|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'city' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'email' => 'required|email|max:255|unique:schools,email',
            'phone' => 'required|string|max:20',
            'website' => 'nullable|url|max:255',
            'principal_name' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer|min:0',
        ]);
        
        // Génération du code si non fourni
        if (empty($validated['code'])) {
            $validated['code'] = 'SCH-' . strtoupper(Str::random(6));
        }
        
        // Ajout de l'utilisateur créateur
        $validated['created_by'] = Auth::id();
        $validated['updated_by'] = Auth::id();
        
        $school = School::create($validated);
        
        return redirect()
            ->route('schools.show', $school->id)
            ->with('success', 'Établissement créé avec succès !');
    }

    /**
     * Affiche les détails d'un établissement
     */
    public function show(School $school)
    {
        $this->authorize('view', $school);
        
        $school->load([
            'createdBy:id,name',
            'updatedBy:id,name',
            'hosts:id,name,email,phone',
        ]);
        
        return Inertia::render('Schools/Show', [
            'school' => $school,
        ]);
    }

    /**
     * Affiche le formulaire de modification d'un établissement
     */
    public function edit(School $school)
    {
        $this->authorize('update', $school);
        
        return Inertia::render('Schools/Edit', [
            'school' => $school->load(['createdBy:id,name', 'updatedBy:id,name']),
        ]);
    }

    /**
     * Met à jour un établissement
     */
    public function update(Request $request, School $school)
    {
        $this->authorize('update', $school);
        
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'code' => 'required|string|max:50|unique:schools,code,' . $school->id,
            'type' => 'required|in:' . implode(',', array_keys(School::getTypeOptions())),
            'status' => 'required|in:' . implode(',', array_keys(School::getStatusOptions())),
            'description' => 'nullable|string',
            'address' => 'required|string|max:255',
            'postal_code' => 'nullable|string|max:20',
            'city' => 'required|string|max:100',
            'country' => 'required|string|max:100',
            'email' => 'required|email|max:255|unique:schools,email,' . $school->id,
            'phone' => 'required|string|max:20',
            'website' => 'nullable|url|max:255',
            'principal_name' => 'nullable|string|max:255',
            'capacity' => 'nullable|integer|min:0',
        ]);
        
        $validated['updated_by'] = Auth::id();
        
        $school->update($validated);
        
        return redirect()
            ->route('schools.show', $school->id)
            ->with('success', 'Établissement mis à jour avec succès !');
    }

    /**
     * Supprime un établissement
     */
    public function destroy(School $school)
    {
        $this->authorize('delete', $school);
        
        // Vérifier s'il y a des utilisateurs associés
        if ($school->hosts()->exists()) {
            return back()->with('error', 'Impossible de supprimer cet établissement car il a des utilisateurs associés.');
        }
        
        $school->delete();
        
        return redirect()
            ->route('schools.index')
            ->with('success', 'Établissement supprimé avec succès !');
    }

    /**
     * Affiche la liste des administrateurs d'un établissement
     */
    public function indexHosts(School $school)
    {
        $this->authorize('view', $school);
        
        $hosts = $school->hosts()->with('roles')->get();
        
        return Inertia::render('Schools/Hosts/Index', [
            'school' => $school->only(['id', 'name', 'code']),
            'hosts' => $hosts->map(function($host) {
                return [
                    'id' => $host->id,
                    'name' => $host->name,
                    'email' => $host->email,
                    'phone' => $host->phone,
                    'roles' => $host->roles->pluck('name')
                ];
            })
        ]);
    }
}

<?php

namespace App\Http\Controllers;

use App\Models\Recruitment;
use App\Models\RecruitmentCustomField;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class RecruitmentController extends Controller
{
    /**
     * Affiche la liste des offres d'emploi
     */
    public function index(Request $request)
    {
        try {
            // Initialisation de la requête
            $query = Recruitment::query()
                ->withCount('applications')
                ->with('creator');

            // Pour les utilisateurs non connectés, ne montrer que les offres publiées
            if (!auth()->check()) {
                $query->where('status', 'published');
            } 
            // Pour les utilisateurs connectés qui ne sont pas admin/manager
            elseif (!(auth()->user()->hasRole('admin') || auth()->user()->hasRole('manager'))) {
                $query->where(function($q) {
                    $q->where('status', 'published')
                      ->orWhere('created_by', auth()->id());
                });
            }
            // Les admins et managers voient toutes les offres

            // Recherche par mot-clé
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('title', 'like', '%'.$search.'%')
                      ->orWhere('description', 'like', '%'.$search.'%')
                      ->orWhere('location', 'like', '%'.$search.'%');
                });
            }

            // Filtre par statut
            if ($request->has('status') && !empty($request->status)) {
                $query->where('status', $request->status);
            }

            // Pagination avec gestion des erreurs
            $perPage = $request->input('per_page', 10);
            
            $recruitments = $query->latest()
                                ->paginate($perPage)
                                ->withQueryString()
                                ->through(function ($recruitment) {
                                    return [
                                        'id' => $recruitment->id,
                                        'title' => $recruitment->title,
                                        'description' => $recruitment->description,
                                        'location' => $recruitment->location,
                                        'type' => $recruitment->type,
                                        'status' => $recruitment->status,
                                        'deadline' => $recruitment->deadline ? $recruitment->deadline->toIso8601String() : null,
                                        'created_at' => $recruitment->created_at,
                                        'applications_count' => $recruitment->applications_count,
                                        'creator' => $recruitment->creator ? [
                                            'id' => $recruitment->creator->id,
                                            'name' => $recruitment->creator->name,
                                            'email' => $recruitment->creator->email,
                                        ] : null,
                                    ];
                                });

            // Préparer les données pour Inertia
            $inertiaData = [
                'recruitments' => $recruitments,
                'filters' => $request->only(['search', 'status']),
                'canCreate' => auth()->check() && (auth()->user()->hasRole('admin') || auth()->user()->hasRole('manager')),
            ];

            // Ajouter les données d'authentification si l'utilisateur est connecté
            if (auth()->check()) {
                $inertiaData['auth'] = [
                    'user' => [
                        'id' => auth()->id(),
                        'name' => auth()->user()->name,
                        'email' => auth()->user()->email,
                        'profile_photo_url' => auth()->user()->profile_photo_url ?? null,
                        'profile_photo_path' => auth()->user()->profile_photo_path ?? null,
                        'roles' => auth()->user()->getRoleNames()->toArray(),
                    ]
                ];
            }

            return Inertia::render('Recruitment/Index', $inertiaData);
            
        } catch (\Exception $e) {
            \Log::error('Error in RecruitmentController@index: ' . $e->getMessage());
            
            return Inertia::render('Recruitment/Index', [
                'recruitments' => [
                    'data' => [],
                    'links' => [],
                    'from' => 0,
                    'to' => 0,
                    'total' => 0,
                    'current_page' => 1,
                    'last_page' => 1,
                ],
                'filters' => $request->only(['search', 'status']),
                'canCreate' => false,
                'auth' => null,
                'error' => 'Une erreur est survenue lors du chargement des offres d\'emploi.'
            ]);
        }
    }

    /**
     * Affiche le formulaire de création d'une offre
     */
    public function create()
    {
        $this->authorize('create', Recruitment::class);
        
        $inertiaData = [];
        
        // Ajouter les données d'authentification si l'utilisateur est connecté
        if (auth()->check()) {
            $inertiaData['auth'] = [
                'user' => [
                    'id' => auth()->id(),
                    'name' => auth()->user()->name,
                    'email' => auth()->user()->email,
                    'profile_photo_url' => auth()->user()->profile_photo_url,
                    'profile_photo_path' => auth()->user()->profile_photo_path,
                    'roles' => auth()->user()->getRoleNames()->toArray()
                ]
            ];
        }
        
        // Types de champs disponibles pour le formulaire
        $fieldTypes = [
            ['value' => 'text', 'label' => 'Texte court'],
            ['value' => 'textarea', 'label' => 'Zone de texte'],
            ['value' => 'number', 'label' => 'Nombre'],
            ['value' => 'email', 'label' => 'Email'],
            ['value' => 'tel', 'label' => 'Téléphone'],
            ['value' => 'date', 'label' => 'Date'],
            ['value' => 'select', 'label' => 'Liste déroulante'],
            ['value' => 'checkbox', 'label' => 'Case à cocher'],
            ['value' => 'radio', 'label' => 'Bouton radio'],
            ['value' => 'file', 'label' => 'Fichier']
        ];

        $inertiaData['fieldTypes'] = $fieldTypes;
        $inertiaData['customFields'] = [];
        
        return Inertia::render('Recruitment/Create', $inertiaData);
    }

    /**
     * Enregistre une nouvelle offre
     */
    public function store(Request $request)
    {
        $this->authorize('create', Recruitment::class);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'custom_fields' => 'nullable|array',
            'custom_fields.*.field_name' => 'required|string|max:100',
            'custom_fields.*.field_label' => 'required|string|max:255',
            'custom_fields.*.field_type' => 'required|string|in:text,textarea,number,email,tel,date,select,checkbox,radio,file',
            'custom_fields.*.is_required' => 'sometimes|boolean',
            'custom_fields.*.options' => 'nullable|array',
            'type' => 'required|string|in:' . implode(',', [
                Recruitment::TYPE_CDI,
                Recruitment::TYPE_CDD,
                Recruitment::TYPE_INTERIM,
                Recruitment::TYPE_STAGE,
                Recruitment::TYPE_ALTERNANCE,
            ]),
            'location' => 'required|string|max:255',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gt:salary_min',
            'experience_level' => 'nullable|string|max:255',
            'education_level' => 'nullable|string|max:255',
            'skills' => 'nullable|array',
            'skills.*' => 'string|max:255',
            'deadline' => 'nullable|date|after:now',
            'auto_close' => 'sometimes|boolean',
            'status' => 'required|in:draft,published,closed'
        ]);

        // Créer l'offre avec les données validées
        $recruitment = new Recruitment([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'type' => $validated['type'],
            'location' => $validated['location'],
            'salary_min' => $validated['salary_min'] ?? null,
            'salary_max' => $validated['salary_max'] ?? null,
            'experience_level' => $validated['experience_level'] ?? null,
            'education_level' => $validated['education_level'] ?? null,
            'skills' => $validated['skills'] ?? [],
            'deadline' => isset($validated['deadline']) ? new \DateTime($validated['deadline']) : null,
            'auto_close' => $validated['auto_close'] ?? true,
            'status' => $validated['status'] ?? 'draft',
            'created_by' => Auth::id(),
        ]);
        
        $recruitment->save();

        // Enregistrer les champs personnalisés s'il y en a
        if ($request->has('custom_fields') && is_array($request->custom_fields)) {
            foreach ($request->custom_fields as $index => $field) {
                $recruitment->customFields()->create([
                    'field_name' => $field['field_name'],
                    'field_label' => $field['field_label'],
                    'field_type' => $field['field_type'],
                    'is_required' => $field['is_required'] ?? false,
                    'options' => $field['options'] ?? null,
                    'order' => $index
                ]);
            }
        }

        return redirect()->route('recruitment.index')
            ->with('success', 'L\'offre a été créée avec succès.');
    }

    /**
     * Affiche une offre spécifique
     */
    public function show(Recruitment $recruitment)
    {
        // Vérifier l'autorisation en utilisant la politique
        $this->authorize('view', $recruitment);
        
        $recruitment->load(['creator', 'applications', 'customFields']);
        
        // Vérifier si l'utilisateur actuel peut gérer l'offre
        $canManage = false;
        if (auth()->check()) {
            $canManage = auth()->user()->can('update', $recruitment) || 
                         auth()->user()->can('delete', $recruitment);
        }
        
        // Vérifier si l'utilisateur peut postuler
        // Seulement si l'offre est publiée et que l'utilisateur n'a pas déjà postulé
        $canApply = false;
        if (auth()->check() && $recruitment->status === 'published') {
            $canApply = !$recruitment->applications->contains('user_id', auth()->id());
        }
        
        // Préparer les données pour Inertia
        $inertiaData = [
            'recruitment' => array_merge($recruitment->load('creator')->toArray(), [
                'deadline' => $recruitment->deadline ? $recruitment->deadline->toIso8601String() : null,
                'auto_close' => $recruitment->auto_close,
                'is_expired' => $recruitment->isExpired(),
                'time_remaining' => $recruitment->getTimeRemaining(),
            ]),
            'canManage' => $canManage,
            'canApply' => $canApply,
        ];
        
        // Ajouter les données d'authentification si l'utilisateur est connecté
        if (auth()->check()) {
            $user = auth()->user();
            $inertiaData['auth'] = [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'profile_photo_url' => $user->profile_photo_url,
                    'profile_photo_path' => $user->profile_photo_path,
                    'roles' => $user->getRoleNames()->toArray()
                ]
            ];
        }
        
        return Inertia::render('Recruitment/Show', $inertiaData);
    }

    /**
     * Affiche le formulaire d'édition d'une offre
     */
    public function edit(Recruitment $recruitment)
    {
        // Log pour le débogage
        \Log::info('Tentative d\'accès à l\'édition de l\'offre', [
            'user_id' => auth()->id(),
            'user_roles' => auth()->user()->getRoleNames(),
            'recruitment_id' => $recruitment->id,
            'created_by' => $recruitment->created_by
        ]);

        try {
            $this->authorize('update', $recruitment);
            
            // Types de champs disponibles pour le formulaire
            $fieldTypes = [
                ['value' => 'text', 'label' => 'Texte court'],
                ['value' => 'textarea', 'label' => 'Zone de texte'],
                ['value' => 'number', 'label' => 'Nombre'],
                ['value' => 'email', 'label' => 'Email'],
                ['value' => 'tel', 'label' => 'Téléphone'],
                ['value' => 'date', 'label' => 'Date'],
                ['value' => 'select', 'label' => 'Liste déroulante'],
                ['value' => 'checkbox', 'label' => 'Case à cocher'],
                ['value' => 'radio', 'label' => 'Bouton radio'],
                ['value' => 'file', 'label' => 'Fichier']
            ];
            
            // Préparer les données pour Inertia
            $inertiaData = [
                'recruitment' => $recruitment->load(['creator', 'customFields']),
                'fieldTypes' => $fieldTypes
            ];
            
            // Ajouter les données d'authentification si l'utilisateur est connecté
            if (auth()->check()) {
                $user = auth()->user();
                $inertiaData['auth'] = [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'profile_photo_url' => $user->profile_photo_url,
                        'profile_photo_path' => $user->profile_photo_path,
                        'roles' => $user->getRoleNames()->toArray()
                    ]
                ];
            }
            
            return Inertia::render('Recruitment/Edit', $inertiaData);
            
        } catch (\Exception $e) {
            \Log::error('Erreur d\'autorisation', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'recruitment_id' => $recruitment->id
            ]);
            
            abort(403, 'Accès non autorisé à cette ressource.');
        }
    }

    /**
     * Met à jour une offre existante
     */
    public function update(Request $request, Recruitment $recruitment)
    {
        $this->authorize('update', $recruitment);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'custom_fields' => 'nullable|array',
            'custom_fields.*.field_name' => 'required|string|max:100',
            'custom_fields.*.field_label' => 'required|string|max:255',
            'custom_fields.*.field_type' => 'required|string|in:text,textarea,number,email,tel,date,select,checkbox,radio,file',
            'custom_fields.*.is_required' => 'sometimes|boolean',
            'custom_fields.*.options' => 'nullable|array',
            'type' => 'required|string|in:' . implode(',', [
                Recruitment::TYPE_CDI,
                Recruitment::TYPE_CDD,
                Recruitment::TYPE_INTERIM,
                Recruitment::TYPE_STAGE,
                Recruitment::TYPE_ALTERNANCE,
            ]),
            'location' => 'required|string|max:255',
            'salary_min' => 'nullable|numeric|min:0',
            'salary_max' => 'nullable|numeric|min:0|gt:salary_min',
            'experience_level' => 'nullable|string|max:255',
            'education_level' => 'nullable|string|max:255',
            'skills' => 'nullable|array',
            'skills.*' => 'string|max:255',
            'deadline' => 'nullable|date|after:now',
            'auto_close' => 'sometimes|boolean',
            'status' => 'required|in:draft,published,closed'
        ]);

        // Mettre à jour l'offre avec les données validées
        $recruitment->update([
            'title' => $validated['title'],
            'description' => $validated['description'],
            'type' => $validated['type'],
            'location' => $validated['location'],
            'salary_min' => $validated['salary_min'] ?? null,
            'salary_max' => $validated['salary_max'] ?? null,
            'experience_level' => $validated['experience_level'] ?? null,
            'education_level' => $validated['education_level'] ?? null,
            'skills' => $validated['skills'] ?? [],
            'deadline' => isset($validated['deadline']) ? new \DateTime($validated['deadline']) : null,
            'auto_close' => $validated['auto_close'] ?? true,
            'status' => $validated['status']
        ]);
        
        // Mettre à jour les champs personnalisés
        if ($request->has('custom_fields') && is_array($request->custom_fields)) {
            // Supprimer les champs personnalisés existants
            $recruitment->customFields()->delete();
            
            // Ajouter les nouveaux champs personnalisés
            foreach ($request->custom_fields as $index => $field) {
                $recruitment->customFields()->create([
                    'field_name' => $field['field_name'],
                    'field_label' => $field['field_label'],
                    'field_type' => $field['field_type'],
                    'is_required' => $field['is_required'] ?? false,
                    'options' => $field['options'] ?? null,
                    'order' => $index
                ]);
            }
        }

        return redirect()->route('recruitment.show', $recruitment)
            ->with('success', 'L\'offre a été mise à jour avec succès.');
    }

    /**
     * Supprime une offre
     */
    public function destroy(Recruitment $recruitment)
    {
        $this->authorize('delete', $recruitment);

        $recruitment->delete();

        return redirect()->route('recruitment.index')
            ->with('success', 'L\'offre a été supprimée avec succès.');
    }

    /**
     * Change le statut d'une offre (publication/fermeture)
     */
    public function updateStatus(Request $request, Recruitment $recruitment)
    {
        $this->authorize('update', $recruitment);

        $validated = $request->validate([
            'status' => 'required|in:published,closed'
        ]);

        $recruitment->update(['status' => $validated['status']]);

        return back()->with('success', 'Le statut de l\'offre a été mis à jour.');
    }
}

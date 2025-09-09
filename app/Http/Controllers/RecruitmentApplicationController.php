<?php

namespace App\Http\Controllers;

use App\Models\Recruitment;
use App\Models\RecruitmentApplication;
use App\Models\RecruitmentCustomField;
use App\Exports\ApplicationsExport;
use App\Notifications\ApplicationStatusChanged;
use Maatwebsite\Excel\Facades\Excel;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class RecruitmentApplicationController extends Controller
{
    /**
     * Affiche la liste des candidatures pour une offre
     */
    public function index(Recruitment $recruitment, Request $request)
    {
        $this->authorize('viewApplications', $recruitment);
        
        $applications = $recruitment->applications()
            ->with(['user'])
            ->when($request->search, function($query, $search) {
                $query->where(function($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                      ->orWhere('last_name', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Recruitment/Applications/Index', [
            'recruitment' => $recruitment,
            'applications' => $applications,
            'filters' => $request->only(['search'])
        ]);
    }

    /**
     * Affiche le formulaire de candidature
     */
    public function create(Recruitment $recruitment)
    {
        $this->authorize('apply', $recruitment);
        
        // Charger les champs personnalisés avec l'offre
        $recruitment->load(['customFields' => function($query) {
            $query->orderBy('order');
        }]);
        
        // Récupérer l'utilisateur connecté
        $user = auth()->user();
        
        return Inertia::render('Recruitment/Applications/Create', [
            'recruitment' => $recruitment,
            'auth' => [
                'user' => $user ? [
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone
                ] : null
            ],
            'fieldTypes' => [
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
            ]
        ]);
    }

    /**
     * Enregistre une nouvelle candidature
     */
    public function store(Request $request, Recruitment $recruitment)
    {
        $this->authorize('apply', $recruitment);

        // Règles de validation de base
        $rules = [
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'required|string|max:20',
            'cover_letter' => 'nullable|string',
            'resume' => 'required|file|mimes:pdf,doc,docx|max:5120', // 5MB max
        ];

        // Récupérer les champs personnalisés et ajouter les règles de validation
        $customFields = $recruitment->customFields;
        $customFieldsData = [];
        
        foreach ($customFields as $field) {
            $rule = [];
            if ($field->is_required) {
                $rule[] = 'required';
            } else {
                $rule[] = 'nullable';
            }
            
            // Ajouter des règles spécifiques selon le type de champ
            switch ($field->field_type) {
                case 'email':
                    $rule[] = 'email';
                    break;
                case 'number':
                    $rule[] = 'numeric';
                    break;
                case 'date':
                    $rule[] = 'date';
                    break;
                case 'file':
                    $rule[] = 'file';
                    $rule[] = 'mimes:pdf,doc,docx,jpg,jpeg,png';
                    $rule[] = 'max:5120'; // 5MB
                    break;
            }
            
            $rules['custom_fields.' . $field->id] = $rule;
        }

        $validated = $request->validate($rules);

        // Téléchargement du CV
        $resumePath = $request->file('resume')->store('resumes', 'public');

        // Initialiser les données des champs personnalisés
        $customFieldsData = [];
        
        // Traiter les champs personnalisés s'ils existent
        if (isset($validated['custom_fields'])) {
            foreach ($validated['custom_fields'] as $fieldId => $value) {
                $field = $customFields->find($fieldId);
                if (!$field) continue;
                
                // Gérer les différents types de champs
                if ($field->field_type === 'file' && $value instanceof \Illuminate\Http\UploadedFile) {
                    // Gestion des fichiers
                    $path = $value->store('custom-fields', 'public');
                    $value = [
                        'file_name' => $value->getClientOriginalName(),
                        'file_path' => $path,
                        'mime_type' => $value->getClientMimeType(),
                        'size' => $value->getSize(),
                    ];
                } elseif ($field->field_type === 'checkbox' && is_array($field->options) && count($field->options) > 0) {
                    // Pour les cases à cocher multiples, s'assurer que la valeur est un tableau
                    if (!is_array($value)) {
                        $value = [];
                    }
                    // Filtrer les valeurs pour ne garder que celles qui sont dans les options
                    $value = array_intersect($value, $field->options);
                }
                
                // Stocker la valeur dans le tableau des champs personnalisés
                $customFieldsData[$field->field_name] = $value;
            }
        }
        
        // Créer l'application avec les champs personnalisés
        $application = new RecruitmentApplication([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'phone' => $validated['phone'],
            'cover_letter' => $validated['cover_letter'] ?? null,
            'resume_path' => $resumePath,
            'status' => 'pending',
            'user_id' => Auth::id(),
            'custom_fields' => $customFieldsData  // Utiliser le champ 'custom_fields' au lieu de 'custom_fields_data'
        ]);

        $recruitment->applications()->save($application);

        return redirect()->route('recruitment.show', $recruitment)
            ->with('success', 'Votre candidature a été soumise avec succès.');
    }

    /**
     * Affiche une candidature spécifique
     */
    public function show(Recruitment $recruitment, RecruitmentApplication $application)
    {
        $this->authorize('view', $application);
        
        // Charger l'utilisateur
        $application->load('user');
        
        $allCustomFields = $recruitment->customFields()
            ->orderBy('order')
            ->get()
            ->map(function($field) use ($application) {
                // Récupérer la valeur du champ depuis custom_fields (JSON)
                $value = null;
                $filePath = null;
                
                // Vérifier si le champ personnalisé existe dans les données
                if (isset($application->custom_fields[$field->field_name])) {
                    $value = $application->custom_fields[$field->field_name];
                    
                    // Si c'est un fichier, extraire le chemin du fichier
                    if ($field->field_type === 'file' && is_array($value) && isset($value['file_path'])) {
                        $filePath = $value['file_path'];
                        $value = $value['file_name']; // Utiliser le nom du fichier comme valeur d'affichage
                    }
                }
                
                $fieldData = [
                    'id' => $field->id,
                    'field_name' => $field->field_name,
                    'field_label' => $field->field_label,
                    'field_type' => $field->field_type,
                    'options' => $field->options,
                    'value' => $value,
                    'file_url' => null,
                    'file_name' => null
                ];
                
                // Gestion spéciale pour les fichiers
                if ($field->field_type === 'file' && $filePath) {
                    $fieldData['file_url'] = Storage::url($filePath);
                    $fieldData['file_name'] = basename($filePath);
                    
                    // Si c'est une image, on peut ajouter une URL de miniature
                    if (in_array(strtolower(pathinfo($filePath, PATHINFO_EXTENSION)), ['jpg', 'jpeg', 'png', 'gif'])) {
                        $fieldData['thumbnail_url'] = Storage::url($filePath); // Utiliser la même URL pour l'aperçu
                    }
                }
                
                // Décoder les options si c'est une chaîne JSON
                if (is_string($fieldData['options'])) {
                    $fieldData['options'] = json_decode($fieldData['options'], true);
                }
                
                return $fieldData;
            });
            
        return Inertia::render('Recruitment/Applications/Show', [
            'recruitment' => $recruitment->load('customFields'),
            'application' => $application,
            'customFields' => $allCustomFields->values()->all()
        ]);
    }

    /**
     * Affiche le CV d'une candidature dans le navigateur
     */
    public function downloadResume(Recruitment $recruitment, RecruitmentApplication $application)
    {
        $this->authorize('view', $application);
        
        if (!Storage::disk('public')->exists($application->resume_path)) {
            abort(404);
        }
        
        $file = Storage::disk('public')->path($application->resume_path);
        $mimeType = Storage::disk('public')->mimeType($application->resume_path);
        
        return response()->file($file, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => 'inline; filename="' . 'CV_' . $application->last_name . '_' . $application->first_name . '.' . pathinfo($application->resume_path, PATHINFO_EXTENSION) . '"',
            'Cache-Control' => 'no-cache, no-store, must-revalidate',
            'Pragma' => 'no-cache',
            'Expires' => '0'
        ]);
    }
    
    /**
     * Télécharge un fichier personnalisé d'une candidature
     */
    public function downloadCustomFile(Recruitment $recruitment, RecruitmentApplication $application, $fieldName)
    {
        $this->authorize('view', $application);
        
        // Vérifier si le champ personnalisé existe et est un fichier
        if (!isset($application->custom_fields[$fieldName]) || 
            !is_array($application->custom_fields[$fieldName]) || 
            !isset($application->custom_fields[$fieldName]['file_path'])) {
            abort(404);
        }
        
        $fileInfo = $application->custom_fields[$fieldName];
        $filePath = $fileInfo['file_path'];
        
        if (!Storage::disk('public')->exists($filePath)) {
            abort(404);
        }
        
        $fileName = $fileInfo['file_name'] ?? 'fichier_' . $fieldName . '.' . pathinfo($filePath, PATHINFO_EXTENSION);
        
        return Storage::disk('public')->download($filePath, $fileName);
    }

    /**
     * Met à jour le statut d'une candidature
     */
    public function updateStatus(Request $request, Recruitment $recruitment, RecruitmentApplication $application)
    {
        $this->authorize('update', $application);

        $validated = $request->validate([
            'status' => 'required|in:pending,reviewed,interviewed,accepted,rejected',
            'notes' => 'nullable|string',
        ]);

        $oldStatus = $application->status;
        $newStatus = $validated['status'];
        $notes = $validated['notes'] ?? $application->notes;

        $application->update([
            'status' => $newStatus,
            'notes' => $notes,
        ]);

        $application->refresh();

        // Envoyer une notification uniquement si le statut a changé
        if ($oldStatus !== $newStatus) {
            try {
                $application->notify(
                    new ApplicationStatusChanged($application, $newStatus, $notes)
                );
            } catch (\Exception $e) {
                \Log::error('Erreur lors de l\'envoi de la notification de changement de statut : ' . $e->getMessage());
            }
        }

        return back()->with([
            'success' => 'Le statut de la candidature a été mis à jour.',
            'application' => $application->fresh()
        ]);
    }

    /**
     * Supprime une candidature
     */
    public function destroy(Recruitment $recruitment, RecruitmentApplication $application)
    {
        $this->authorize('delete', $application);

        // Supprimer le fichier de CV
        if (Storage::disk('public')->exists($application->resume_path)) {
            Storage::disk('public')->delete($application->resume_path);
        }

        $application->delete();

        return redirect()->route('recruitment.applications.index', $recruitment)
            ->with('success', 'La candidature a été supprimée avec succès.');
    }

    /**
     * Exporte les candidatures au format Excel
     */
    public function export(Recruitment $recruitment)
    {
        $this->authorize('viewAny', [RecruitmentApplication::class, $recruitment]);
        
        $fileName = 'candidatures-' . $recruitment->slug . '-' . now()->format('Y-m-d-His') . '.xlsx';
        
        return Excel::download(new ApplicationsExport($recruitment->id), $fileName);
    }
}

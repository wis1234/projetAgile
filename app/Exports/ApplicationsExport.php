<?php

namespace App\Exports;

use App\Models\Recruitment;
use App\Models\RecruitmentApplication;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class ApplicationsExport implements FromCollection, WithHeadings, WithMapping
{
    protected $recruitmentId;

    public function __construct($recruitmentId)
    {
        $this->recruitmentId = $recruitmentId;
    }

    public function collection()
    {
        return RecruitmentApplication::with(['recruitment', 'user', 'recruitment.customFields'])
            ->where('recruitment_id', $this->recruitmentId)
            ->get()
            ->map(function($application) {
                // Récupérer les champs personnalisés de l'offre
                $customFields = [];
                if ($application->recruitment->customFields) {
                    foreach ($application->recruitment->customFields as $field) {
                        $fieldName = $field->name;
                        $fieldValue = $application->custom_fields[$fieldName] ?? null;
                        
                        // Formater la valeur en fonction du type de champ
                        if (is_array($fieldValue)) {
                            $customFields[$fieldName] = is_array($fieldValue['value'] ?? null) 
                                ? implode(', ', $fieldValue['value'])
                                : ($fieldValue['value'] ?? '');
                        } else {
                            $customFields[$fieldName] = $fieldValue;
                        }
                    }
                }
                
                $application->formatted_custom_fields = $customFields;
                return $application;
            });
    }

    public function headings(): array
    {
        // Récupérer les en-têtes de base
        $headings = [
            'ID',
            'Nom',
            'Prénom',
            'Email',
            'Téléphone',
            'Statut',
            'Date de candidature',
            'Lien CV',
            'Lettre de motivation',
            'Notes'
        ];
        
        // Ajouter les en-têtes des champs personnalisés
        $recruitment = Recruitment::with('customFields')->find($this->recruitmentId);
        if ($recruitment->customFields) {
            foreach ($recruitment->customFields as $field) {
                $headings[] = $field->name;
            }
        }
        
        // Ajouter le profil de personnalité à la fin
        $headings[] = 'Profil de personnalité';
        
        return $headings;
    }

    public function map($application): array
    {
        // Données de base
        $data = [
            $application->id,
            $application->last_name,
            $application->first_name,
            $application->email,
            $application->phone,
            $this->getStatusLabel($application->status),
            $application->created_at->format('d/m/Y H:i'),
            $application->resume_path ? asset('storage/' . $application->resume_path) : 'Non fourni',
            $application->cover_letter ? 'Oui' : 'Non',
            $application->notes,
        ];
        
        // Ajouter les valeurs des champs personnalisés dans l'ordre des en-têtes
        if (isset($application->formatted_custom_fields)) {
            $data = array_merge($data, array_values($application->formatted_custom_fields));
        }
        
        // Ajouter le profil de personnalité à la fin
        $personalityProfile = [];
        if (!empty($application->personality_profile)) {
            foreach ($application->personality_profile as $key => $value) {
                if (is_array($value)) {
                    $personalityProfile[] = "$key: " . implode(', ', array_map(
                        function($k, $v) { return "$k: $v"; },
                        array_keys($value),
                        $value
                    ));
                } else {
                    $personalityProfile[] = "$key: $value";
                }
            }
        }
        
        $data[] = implode("\n", $personalityProfile);
        
        return $data;
    }

    protected function getStatusLabel($status)
    {
        $statuses = [
            'pending' => 'En attente',
            'reviewed' => 'Examinée',
            'interviewed' => 'En entretien',
            'accepted' => 'Acceptée',
            'rejected' => 'Rejetée'
        ];

        return $statuses[$status] ?? $status;
    }
}

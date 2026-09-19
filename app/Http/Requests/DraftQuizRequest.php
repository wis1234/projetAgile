<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Création d'un brouillon de quiz (avant d'enregistrer la première question).
 */
class DraftQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return StoreQuizRequest::settingsRules();
    }

    public function messages(): array
    {
        return [
            'title.required' => 'Renseignez d\'abord le titre du quiz (Paramètres généraux).',
        ];
    }
}

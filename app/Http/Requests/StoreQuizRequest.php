<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Réglages généraux (le type du quiz est déduit automatiquement des questions).
     */
    public static function settingsRules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:360'],
            'max_attempts' => ['required', 'integer', 'min:1', 'max:100'],
            'is_active' => ['boolean'],
            'show_results' => ['boolean'],
        ];
    }

    public static function questionRules(string $prefix = ''): array
    {
        return [
            "{$prefix}question_text" => ['required', 'string'],
            "{$prefix}question_type" => ['required', 'in:qcm,written'],
            "{$prefix}option_a" => ["nullable", "required_if:{$prefix}question_type,qcm", 'string'],
            "{$prefix}option_b" => ["nullable", "required_if:{$prefix}question_type,qcm", 'string'],
            "{$prefix}option_c" => ['nullable', 'string'],
            "{$prefix}option_d" => ['nullable', 'string'],
            "{$prefix}correct_answer" => ['nullable', "required_if:{$prefix}question_type,qcm", 'integer', 'in:0,1,2,3'],
        ];
    }

    public function rules(): array
    {
        return static::settingsRules() + [
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.id' => ['nullable', 'integer'],
        ] + static::questionRules('questions.*.');
    }

    public function messages(): array
    {
        return [
            'questions.required' => 'Ajoutez au moins une question avant d\'enregistrer le quiz.',
            'questions.min' => 'Ajoutez au moins une question avant d\'enregistrer le quiz.',
            'questions.*.question_text.required' => 'L\'intitulé de la question est obligatoire.',
            'questions.*.option_a.required_if' => 'Les options A et B sont obligatoires pour un QCM.',
            'questions.*.option_b.required_if' => 'Les options A et B sont obligatoires pour un QCM.',
        ];
    }
}

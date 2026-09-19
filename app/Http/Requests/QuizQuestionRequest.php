<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class QuizQuestionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return StoreQuizRequest::questionRules();
    }

    public function messages(): array
    {
        return [
            'question_text.required' => 'L\'intitulé de la question est obligatoire.',
            'option_a.required_if' => 'Les options A et B sont obligatoires pour un QCM.',
            'option_b.required_if' => 'Les options A et B sont obligatoires pour un QCM.',
        ];
    }
}

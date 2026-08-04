<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreQuizRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'quiz_type' => ['required', 'in:qcm,written,mixed'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:360'],
            'max_attempts' => ['required', 'integer', 'min:1', 'max:100'],
            'is_active' => ['boolean'],
            'show_results' => ['boolean'],
            'questions' => ['required', 'array', 'min:1'],
            'questions.*.question_text' => ['required', 'string'],
            'questions.*.question_type' => ['required', 'in:qcm,written'],
            'questions.*.option_a' => ['nullable', 'required_if:questions.*.question_type,qcm', 'string'],
            'questions.*.option_b' => ['nullable', 'required_if:questions.*.question_type,qcm', 'string'],
            'questions.*.option_c' => ['nullable', 'string'],
            'questions.*.option_d' => ['nullable', 'string'],
            'questions.*.correct_answer' => ['nullable', 'required_if:questions.*.question_type,qcm', 'integer', 'in:0,1,2,3'],
        ];
    }
}

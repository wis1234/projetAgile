<?php

namespace App\Http\Requests;

use App\Models\User;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class ProfileUpdateRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'required', 'string', 'max:255'],
            'email' => [
                'sometimes', 'required',
                'string',
                'lowercase',
                'email',
                'max:255',
                Rule::unique(User::class)->ignore($this->user()->id),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'company' => ['nullable', 'string', 'max:100'],
            'profile_photo' => ['nullable', 'image', 'max:1024'], // 1MB Max
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Le nom est obligatoire.',
            'email.required' => "L'adresse e-mail est obligatoire.",
            'email.email' => "Saisissez une adresse e-mail valide.",
            'email.lowercase' => "L'adresse e-mail doit être en minuscules.",
            'email.unique' => 'Cette adresse e-mail est déjà utilisée.',
            'profile_photo.image' => 'Le fichier doit être une image.',
            'profile_photo.max' => 'La photo ne doit pas dépasser 1 Mo.',
            'bio.max' => 'La présentation ne doit pas dépasser 1000 caractères.',
        ];
    }
}

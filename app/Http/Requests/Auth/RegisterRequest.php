<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use App\Models\User;
use Illuminate\Support\Str;

class RegisterRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /** Nettoie les saisies avant validation (espaces, casse de l'e-mail). */
    protected function prepareForValidation(): void
    {
        $this->merge([
            'name' => trim(preg_replace('/\s+/', ' ', (string) $this->input('name'))),
            'email' => Str::lower(trim((string) $this->input('email'))),
            // Un ancien formulaire (sans choix de rôle) crée un compte « Utilisateur ».
            'role' => $this->filled('role') ? $this->input('role') : User::ROLE_USER,
        ]);
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'min:2', 'max:255'],
            'email' => ['required', 'string', 'email:rfc', 'max:255', 'unique:users,email'],
            'role' => ['required', 'in:' . User::ROLE_USER . ',' . User::ROLE_CANDIDATE],
            'password' => ['required', 'string', 'min:8', 'max:255', 'confirmed'],
            'profile_photo' => ['nullable', 'image', 'max:2048'],
            'phone' => ['nullable', 'string', 'max:20'],
            'job_title' => ['nullable', 'string', 'max:100'],
            'company' => ['nullable', 'string', 'max:100'],
            'bio' => ['nullable', 'string', 'max:1000'],
            'recaptcha_token' => ['required', 'string'],
        ];
    }

    public function messages(): array
    {
        return [
            'name.required' => 'Indiquez votre nom complet.',
            'name.min' => 'Votre nom doit contenir au moins 2 caractères.',
            'name.max' => 'Votre nom ne peut pas dépasser 255 caractères.',

            'email.required' => 'Indiquez votre adresse email.',
            'email.email' => 'Cette adresse email n\'est pas valide (exemple : nom@entreprise.com).',
            'email.max' => 'Cette adresse email est trop longue.',
            'email.unique' => 'Cette adresse email est déjà associée à un compte. Connectez-vous ou réinitialisez votre mot de passe.',

            'role.required' => 'Indiquez votre type de compte.',
            'role.in' => 'Ce type de compte n\'est pas valide. Choisissez « Utilisateur » ou « Candidat ».',

            'password.required' => 'Choisissez un mot de passe.',
            'password.min' => 'Le mot de passe doit contenir au moins 8 caractères.',
            'password.max' => 'Le mot de passe est trop long.',
            'password.confirmed' => 'Les deux mots de passe ne correspondent pas.',

            'profile_photo.image' => 'La photo de profil doit être une image (JPG, PNG…).',
            'profile_photo.max' => 'La photo de profil ne doit pas dépasser 2 Mo.',

            'recaptcha_token.required' => 'Cochez la case « Je ne suis pas un robot » avant de continuer.',
        ];
    }
}

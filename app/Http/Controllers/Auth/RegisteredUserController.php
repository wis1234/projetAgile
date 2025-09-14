<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Create a new controller instance.
     */
    /**
     * Create a new controller instance.
     */
    public function __construct()
    {
        // Le middleware reCAPTCHA est maintenant géré par la règle de validation
    }
    /**
     * Display the registration view.
     */
    public function create(): Response
    {
        return Inertia::render('Auth/Register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        // Validation des données du formulaire
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'profile_photo' => 'nullable|image|max:2048',
            'phone' => 'nullable|string|max:20',
            'job_title' => 'nullable|string|max:100',
            'company' => 'nullable|string|max:100',
            'bio' => 'nullable|string|max:1000',
        ]);

        try {
            // Création de l'utilisateur avec les données validées
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'phone' => $validated['phone'] ?? null,
                'job_title' => $validated['job_title'] ?? null,
                'company' => $validated['company'] ?? null,
                'bio' => $validated['bio'] ?? null,
            ]);

            // Gestion de la photo de profil si fournie
            if ($request->hasFile('profile_photo')) {
                $user->updateProfilePhoto($request->file('profile_photo'));
            }

            // Déclencher l'événement d'inscription
            event(new Registered($user));

            // Connecter automatiquement l'utilisateur
            Auth::login($user);

            // Rediriger vers le tableau de bord avec un message de succès
            return redirect()->route('dashboard')
                ->with('success', 'Votre compte a été créé avec succès !');

        } catch (\Exception $e) {
            // Journalisation des erreurs en cas d'échec
            Log::error('Erreur lors de la création du compte', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => $request->ip(),
                'email' => $validated['email'] ?? null,
            ]);

            // Redirection avec les erreurs
            return back()->withInput()
                ->with('error', 'Une erreur est survenue lors de la création de votre compte. Veuillez réessayer ou contacter le support si le problème persiste.');
        }
    }
}

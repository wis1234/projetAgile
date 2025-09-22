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
use Illuminate\Support\Facades\Validator;

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
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'profile_photo' => 'nullable|image|max:2048',
            'phone' => 'nullable|string|max:20',
            'job_title' => 'nullable|string|max:100',
            'company' => 'nullable|string|max:100',
            'bio' => 'nullable|string|max:1000',
            'recaptcha_token' => 'required|string',
        ]);

        // Validation du token reCAPTCHA
        try {
            $recaptchaToken = $request->recaptcha_token;
            
            if (empty($recaptchaToken)) {
                $validator->errors()->add('recaptcha_token', 'Le jeton de vérification est manquant.');
                return back()
                    ->withErrors($validator)
                    ->withInput();
            }

            $recaptchaResponse = Http::timeout(10)->asForm()->post('https://www.google.com/recaptcha/api/siteverify', [
                'secret' => config('services.recaptcha.secret_key', '6Lcvg8krAAAAADCaicd7FIRDZNKxXPPgWKcq-K6e'),
                'response' => $recaptchaToken,
                'remoteip' => $request->ip(),
            ]);

            // Vérifier si la requête a réussi
            if (!$recaptchaResponse->successful()) {
                Log::error('Erreur de réponse reCAPTCHA', [
                    'status' => $recaptchaResponse->status(),
                    'body' => $recaptchaResponse->body(),
                ]);
                
                $validator->errors()->add('recaptcha_token', 'Impossible de vérifier la sécurité. Veuillez réessayer.');
                return back()
                    ->withErrors($validator)
                    ->withInput();
            }

            $responseData = $recaptchaResponse->json();
            
            // Journalisation pour le débogage
            Log::debug('Réponse reCAPTCHA', [
                'success' => $responseData['success'] ?? null,
                'score' => $responseData['score'] ?? null,
                'action' => $responseData['action'] ?? null,
                'hostname' => $responseData['hostname'] ?? null,
                'error_codes' => $responseData['error-codes'] ?? null,
            ]);

            if (!$responseData['success']) {
                $errorMessage = 'La vérification de sécurité a échoué. ';
                $errorCodes = $responseData['error-codes'] ?? [];
                
                // Messages d'erreur plus détaillés
                $errorMessages = [
                    'missing-input-secret' => 'Le paramètre secret est manquant.',
                    'invalid-input-secret' => 'Le paramètre secret est invalide ou malformé.',
                    'missing-input-response' => 'Le paramètre de réponse est manquant.',
                    'invalid-input-response' => 'Le paramètre de réponse est invalide ou malformé.',
                    'bad-request' => 'La requête est invalide ou malformée.',
                    'timeout-or-duplicate' => 'La réponse n\'est plus valide : elle est trop ancienne ou a déjà été utilisée.',
                ];
                
                $detailedErrors = [];
                foreach ($errorCodes as $code) {
                    $detailedErrors[] = $errorMessages[$code] ?? $code;
                }
                
                if (!empty($detailedErrors)) {
                    $errorMessage .= 'Raisons : ' . implode(', ', $detailedErrors);
                }
                
                Log::warning('Échec de la validation reCAPTCHA', [
                    'errors' => $errorCodes,
                    'ip' => $request->ip(),
                    'user_agent' => $request->userAgent(),
                ]);
                
                $validator->errors()->add('recaptcha_token', $errorMessage);
                return back()
                    ->withErrors($validator)
                    ->withInput()
                    ->with('error', $errorMessage);
            }

            // Vérifier le score pour reCAPTCHA v3 (optionnel)
            $minimumScore = 0.5; // Score minimum acceptable (0.0 à 1.0)
            if (isset($responseData['score']) && $responseData['score'] < $minimumScore) {
                Log::warning('Score reCAPTCHA trop bas', [
                    'score' => $responseData['score'],
                    'minimum_required' => $minimumScore,
                    'ip' => $request->ip(),
                ]);
                
                $validator->errors()->add('recaptcha_token', 'Activité suspecte détectée. Veuillez réessayer.');
                return back()
                    ->withErrors($validator)
                    ->withInput()
                    ->with('error', 'Activité suspecte détectée. Veuillez réessayer.');
            }
            
            // Vérifier l'action (pour reCAPTCHA v3)
            if (isset($responseData['action']) && $responseData['action'] !== 'submit') {
                Log::warning('Action reCAPTCHA invalide', [
                    'expected' => 'submit',
                    'actual' => $responseData['action'],
                    'ip' => $request->ip(),
                ]);
                
                $validator->errors()->add('recaptcha_token', 'Action de vérification invalide.');
                return back()
                    ->withErrors($validator)
                    ->withInput()
                    ->with('error', 'Action de vérification invalide.');
            }
            
        } catch (\Exception $e) {
            Log::error('Erreur lors de la vérification reCAPTCHA', [
                'exception' => get_class($e),
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'ip' => $request->ip(),
            ]);
            
            $validator->errors()->add('recaptcha_token', 'Une erreur est survenue lors de la vérification de sécurité. Veuillez réessayer.');
            return back()
                ->withErrors($validator)
                ->withInput()
                ->with('error', 'Une erreur est survenue lors de la vérification de sécurité. Veuillez réessayer.');
        }

        if ($validator->fails()) {
            return back()
                ->withErrors($validator)
                ->withInput();
        }

        $validated = $validator->validated();

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

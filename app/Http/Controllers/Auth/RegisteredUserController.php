<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Models\User;
use App\Services\Auth\RecaptchaVerifier;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Throwable;

class RegisteredUserController extends Controller
{
    private const MAX_ATTEMPTS = 10;   // tentatives d'inscription valides par IP…
    private const DECAY_SECONDS = 600;  // …sur 10 minutes

    /**
     * Display the registration view.
     */
    public function create(Request $request): Response
    {
        // ?role=candidate pré-sélectionne « Candidat » (lien envoyé aux personnes invitées à passer un quiz).
        $role = $request->query('role') === User::ROLE_CANDIDATE ? User::ROLE_CANDIDATE : User::ROLE_USER;

        return Inertia::render('Auth/Register', ['defaultRole' => $role]);
    }

    /**
     * Handle an incoming registration request.
     *
     * Chaque cause d'échec renvoie un message précis (clé `form` = erreur générale) :
     * l'interface l'affiche à la fois dans le formulaire et en notification.
     */
    public function store(RegisterRequest $request, RecaptchaVerifier $recaptcha): RedirectResponse
    {
        $throttleKey = 'register:' . $request->ip();

        if (RateLimiter::tooManyAttempts($throttleKey, self::MAX_ATTEMPTS)) {
            $minutes = max(1, (int) ceil(RateLimiter::availableIn($throttleKey) / 60));

            throw ValidationException::withMessages([
                'form' => "Trop de tentatives d'inscription depuis votre connexion. Réessayez dans {$minutes} minute(s).",
            ]);
        }

        // Le reCAPTCHA n'est vérifié qu'une fois les champs valides : un jeton n'est utilisable qu'une fois,
        // une faute de frappe ne doit donc pas obliger à recocher la case.
        $check = $recaptcha->verify($request->input('recaptcha_token'), $request->ip());

        if (!$check['ok']) {
            throw ValidationException::withMessages(['recaptcha_token' => $check['message']]);
        }

        RateLimiter::hit($throttleKey, self::DECAY_SECONDS);

        try {
            $user = DB::transaction(fn () => User::create([
                'name' => $request->input('name'),
                'email' => $request->input('email'),
                'password' => Hash::make($request->input('password')),
                'role' => $request->input('role', User::ROLE_USER),
                'phone' => $request->input('phone'),
                'job_title' => $request->input('job_title'),
                'company' => $request->input('company'),
                'bio' => $request->input('bio'),
            ]));
        } catch (Throwable $e) {
            Log::error('Erreur lors de la création du compte', [
                'error' => $e->getMessage(),
                'email' => $request->input('email'),
                'ip' => $request->ip(),
            ]);

            throw ValidationException::withMessages([
                'form' => 'Votre compte n\'a pas pu être créé pour le moment. Réessayez dans quelques instants.',
            ]);
        }

        // Une photo qui échoue ne doit jamais empêcher l'inscription.
        if ($request->hasFile('profile_photo')) {
            try {
                $user->updateProfilePhoto($request->file('profile_photo'));
            } catch (Throwable $e) {
                report($e);
            }
        }

        // Le compte existe : on envoie l'e-mail de vérification (via l'événement standard `Registered`,
        // un seul e-mail). S'il échoue, l'utilisateur en est informé et peut le renvoyer.
        $emailSent = $this->dispatchRegistered($user);

        $request->session()->put([
            'registered_email' => $user->email,
            'registered_email_sent' => $emailSent,
            'registered_role' => $user->role,
        ]);

        $redirect = redirect()->route('register.success');

        return $emailSent
            ? $redirect->with('success', 'Votre compte a été créé avec succès.')
            : $redirect->with('warning', 'Votre compte a été créé, mais l\'e-mail de vérification n\'a pas pu être envoyé. Utilisez le bouton « Renvoyer l\'e-mail ».');
    }

    /**
     * Écran de confirmation après l'inscription (avec renvoi de l'e-mail).
     */
    public function success(Request $request): Response|RedirectResponse
    {
        $email = $request->session()->get('registered_email');

        if (!$email) {
            return redirect()->route('register');
        }

        return Inertia::render('Auth/RegisterSuccess', [
            'email' => $email,
            'emailSent' => (bool) $request->session()->get('registered_email_sent', true),
            'role' => $request->session()->get('registered_role', User::ROLE_USER),
        ]);
    }

    /**
     * Renvoie l'e-mail de vérification à l'adresse saisie dans CETTE session
     * (aucune adresse n'est acceptée en paramètre : pas d'énumération de comptes).
     */
    public function resend(Request $request): RedirectResponse
    {
        $email = $request->session()->get('registered_email');
        $user = $email ? User::where('email', $email)->first() : null;

        if (!$user) {
            return redirect()->route('register')->with('info', 'Votre session a expiré. Recommencez l\'inscription.');
        }

        if ($user->hasVerifiedEmail()) {
            return redirect()->route('login')->with('success', 'Votre adresse email est déjà vérifiée. Connectez-vous.');
        }

        try {
            $user->sendEmailVerificationNotification();
        } catch (Throwable $e) {
            Log::error('Renvoi de l\'e-mail de vérification impossible', ['user_id' => $user->id, 'error' => $e->getMessage()]);
            $request->session()->put('registered_email_sent', false);

            return back()->with('error', 'L\'e-mail n\'a pas pu être envoyé. Réessayez dans quelques minutes.');
        }

        $request->session()->put('registered_email_sent', true);

        return back()->with('success', 'Un nouvel e-mail de vérification vient de vous être envoyé.');
    }

    private function dispatchRegistered(User $user): bool
    {
        try {
            event(new Registered($user));

            return true;
        } catch (Throwable $e) {
            Log::error('Envoi de l\'e-mail de vérification impossible', [
                'user_id' => $user->id,
                'error' => $e->getMessage(),
            ]);

            return false;
        }
    }
}

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;

class AuthenticatedSessionController extends Controller
{
    /**
     * The maximum number of attempts to allow.
     *
     * @var int
     */
    protected $maxAttempts = 5;

    /**
     * The number of minutes to throttle for.
     *
     * @var int
     */
    protected $decayMinutes = 15;
    /**
     * Display the login view.
     */
    /**
     * Display the login view.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return \Inertia\Response
     */
    public function create(Request $request): Response
    {
        $status = session('status');
        
        // Si la session a expiré, on affiche un message spécifique
        if ($request->has('expired') || session('expired')) {
            $status = 'Votre session a expiré en raison d\'une inactivité prolongée. Veuillez vous reconnecter.';
            // On supprime la clé de session pour éviter de réafficher le message au rafraîchissement
            $request->session()->forget('expired');
        }
        
        return Inertia::render('Auth/Login', [
            'canResetPassword' => Route::has('password.request'),
            'status' => $status,
            'errors' => $request->session()->get('errors') ? $request->session()->get('errors')->getBag('default')->getMessages() : (object) [],
        ]);
    }

    /**
     * Handle an incoming authentication request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(LoginRequest $request): RedirectResponse
    {
        $throttleKey = 'login:' . $request->ip() . ':' . $request->email;
        
        // Vérifier si le taux maximal de tentatives a été dépassé
        if (RateLimiter::tooManyAttempts($throttleKey, $this->maxAttempts)) {
            $seconds = RateLimiter::availableIn($throttleKey);
            return back()->withErrors([
                'email' => [
                    'Trop de tentatives de connexion. Veuillez réessayer dans ' . ceil($seconds / 60) . ' minutes.'
                ]
            ]);
        }

        try {
            $request->authenticate();
            
            // Réinitialiser le compteur en cas de succès
            RateLimiter::clear($throttleKey);
            
            $request->session()->regenerate();

            $user = Auth::user();
            activity_log('login', 'Connexion réussie', $user);

            return redirect()->intended(route('dashboard', absolute: false));
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            // Incrémenter le compteur d'échecs
            RateLimiter::hit($throttleKey, $this->decayMinutes * 60);
            
            throw $e;
        }
    }

    /**
     * Destroy an authenticated session.
     */
    public function destroy(Request $request): RedirectResponse
    {
        $user = Auth::user();
        
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        activity_log('logout', 'Déconnexion', $user);

        return redirect('/');
    }
}

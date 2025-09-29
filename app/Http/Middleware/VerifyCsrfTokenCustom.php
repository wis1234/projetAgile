<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;
use Illuminate\Session\TokenMismatchException;
use Closure;

class VerifyCsrfTokenCustom extends Middleware
{
    /**
     * The URIs that should be excluded from CSRF verification.
     *
     * @var array<int, string>
     */
    protected $except = [
        // Ajoutez ici les routes qui doivent être exclues de la vérification CSRF
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     *
     * @throws \Illuminate\Session\TokenMismatchException
     */
    public function handle($request, Closure $next)
    {
        try {
            return parent::handle($request, $next);
        } catch (TokenMismatchException $e) {
            if ($request->expectsJson() || $request->header('X-Inertia')) {
                // Pour les requêtes AJAX ou Inertia, on retourne une réponse JSON appropriée
                return response()->json([
                    'message' => 'Votre session a expiré. Veuillez rafraîchir la page et vous reconnecter.',
                    'error' => 'token_mismatch',
                    'redirect' => route('session.expired')
                ], 419);
            }

            // Pour les requêtes normales, on recharge simplement la page actuelle
            return back()->withInput()->withErrors([
                'message' => 'Votre session a expiré. Veuillez rafraîchir la page et réessayer.'
            ]);
        }
    }
}

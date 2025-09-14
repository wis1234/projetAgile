<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SecureHeaders
{
    /**
     * Liste des en-têtes de sécurité à appliquer.
     *
     * @var array
     */
    protected $headers = [
        'X-Content-Type-Options' => 'nosniff',
        'X-XSS-Protection' => '1; mode=block',
        'X-Frame-Options' => 'SAMEORIGIN',
        'Referrer-Policy' => 'strict-origin-when-cross-origin',
        'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains',
        'Permissions-Policy' => 'geolocation=(), microphone=(), camera=(), payment=()',
        'X-Content-Security-Policy' => "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https:; style-src 'self' 'unsafe-inline' https:; font-src 'self' https: data:; img-src 'self' https: data:; connect-src 'self' https: wss:; frame-ancestors 'self';",
    ];

    /**
     * Gère une requête entrante.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $response = $next($request);

        // Ne pas ajouter les en-têtes pour les réponses de redirection
        if ($response->isRedirection()) {
            return $response;
        }

        // Ne pas ajouter les en-têtes pour les réponses JSON
        if ($request->expectsJson()) {
            return $response;
        }

        // Ajouter les en-têtes de sécurité
        foreach ($this->headers as $key => $value) {
            $response->headers->set($key, $value, true);
        }

        // Ajouter l'en-tête X-Frame-Options pour les réponses HTML
        if (str_contains($response->headers->get('Content-Type'), 'text/html')) {
            $response->headers->set('X-Frame-Options', 'SAMEORIGIN', true);
        }

        // Protection contre le clic
        $response->headers->set('X-Content-Type-Options', 'nosniff');
        
        // Désactiver la mise en cache pour les pages sensibles
        if ($this->isSensitivePage($request)) {
            $response->headers->set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', '0');
        }

        return $response;
    }

    /**
     * Vérifie si la page est considérée comme sensible.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return bool
     */
    protected function isSensitivePage($request)
    {
        $sensitivePaths = [
            'login',
            'register',
            'password',
            'email/verify',
            'two-factor',
            'admin',
            'dashboard',
            'profile',
            'settings'
        ];

        foreach ($sensitivePaths as $path) {
            if ($request->is($path) || $request->is($path . '/*')) {
                return true;
            }
        }

        return false;
    }
}

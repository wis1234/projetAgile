<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

class ThrottleLoginAttempts
{
    /**
     * Nombre maximal de tentatives autorisées.
     *
     * @var int
     */
    protected $maxAttempts = 5;

    /**
     * Délai d'expiration du blocage en minutes.
     *
     * @var int
     */
    protected $decayMinutes = 15;

    /**
     * Gère une requête entrante.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return mixed
     */
    public function handle(Request $request, Closure $next)
    {
        $key = $this->resolveRequestSignature($request);
        
        if (Cache::has($key . ':lockout')) {
            return $this->buildResponse($key);
        }

        if ($this->hasTooManyLoginAttempts($request, $key)) {
            $this->lockout($key);
            return $this->buildResponse($key);
        }

        $response = $next($request);

        if ($this->isLoginFailure($response)) {
            $this->incrementLoginAttempts($key);
        }

        return $response;
    }

    /**
     * Vérifie si la réponse est un échec de connexion.
     *
     * @param  mixed  $response
     * @return bool
     */
    protected function isLoginFailure($response)
    {
        return $response->getStatusCode() === 302 && 
               session()->has('errors') && 
               session('errors')->has('email');
    }

    /**
     * Vérifie si le nombre maximal de tentatives a été atteint.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  string  $key
     * @return bool
     */
    protected function hasTooManyLoginAttempts(Request $request, $key)
    {
        return Cache::get($key, 0) >= $this->maxAttempts;
    }

    /**
     * Incrémente le nombre de tentatives de connexion.
     *
     * @param  string  $key
     * @return void
     */
    protected function incrementLoginAttempts($key)
    {
        Cache::add($key, 0, now()->addMinutes($this->decayMinutes));
        Cache::increment($key);
    }

    /**
     * Bloque l'accès pour la clé donnée.
     *
     * @param  string  $key
     * @return void
     */
    protected function lockout($key)
    {
        Cache::add($key . ':lockout', time() + ($this->decayMinutes * 60), now()->addMinutes($this->decayMinutes));
        Cache::forget($key);
    }

    /**
     * Construit la réponse de blocage.
     *
     * @param  string  $key
     * @return \Illuminate\Http\Response
     */
    protected function buildResponse($key)
    {
        $seconds = Cache::get($key . ':lockout') - time();
        $minutes = ceil($seconds / 60);

        return back()
            ->withInput()
            ->withErrors([
                'email' => [
                    "Trop de tentatives de connexion. Veuillez réessayer dans {$minutes} minutes."
                ]
            ]);
    }

    /**
     * Resolve request signature.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return string
     */
    public function resolveRequestSignature($request)
    {
        return sha1(
            $request->method() .
            '|' . $request->server('SERVER_NAME') .
            '|' . $request->path() .
            '|' . $request->ip() .
            '|' . $request->header('User-Agent')
        );
    }
}

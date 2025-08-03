<?php

namespace App\Exceptions;

use Exception;
use Inertia\Inertia;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Session\TokenMismatchException;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Throwable;

class Handler extends Exception
{
    public function render($request, Throwable $exception)
    {
        // Gestion des erreurs 403 (Accès refusé)
        if ($exception instanceof \Symfony\Component\HttpKernel\Exception\HttpException && $exception->getStatusCode() === 403) {
            if ($request->hasHeader('X-Inertia')) {
                return Inertia::render('Error403')->toResponse($request)->setStatusCode(403);
            }
        }

        // Gestion des erreurs d'authentification (session expirée)
        if ($exception instanceof AuthenticationException || $exception instanceof TokenMismatchException) {
            if ($request->hasHeader('X-Inertia')) {
                return Inertia::render('Expired')->toResponse($request)->setStatusCode(401);
            }
            
            return redirect()->route('login')->with('error', 'Votre session a expiré. Veuillez vous reconnecter.');
        }

        return parent::render($request, $exception);
    }
}

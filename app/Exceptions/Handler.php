<?php

namespace App\Exceptions;

use Throwable;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Symfony\Component\HttpKernel\Exception\HttpException;

class Handler extends ExceptionHandler
{
    /**
     * Report or log an exception.
     */
    public function report(Throwable $exception): void
    {
        parent::report($exception);
    }

    /**
     * Render an exception into an HTTP response.
     */
    public function render($request, Throwable $exception)
    {
        /*
        |--------------------------------------------------------------------------
        | 403 - Forbidden
        |--------------------------------------------------------------------------
        */
        if ($exception instanceof HttpException && $exception->getStatusCode() === 403) {
            if ($request->header('X-Inertia')) {
                return Inertia::render('Error403')
                    ->toResponse($request)
                    ->setStatusCode(403);
            }

            return parent::render($request, $exception);
        }

        /*
        |--------------------------------------------------------------------------
        | 401 - Authentication expired
        |--------------------------------------------------------------------------
        */
        if ($exception instanceof AuthenticationException) {

            // Requête Inertia
            if ($request->header('X-Inertia')) {
                return Inertia::location(route('login'));
            }

            // Requête navigateur classique
            return redirect()->guest(route('login'));
        }

        /*
        |--------------------------------------------------------------------------
        | 419 - CSRF Token expired
        |--------------------------------------------------------------------------
        */
        if ($exception instanceof TokenMismatchException) {

            // Requête Inertia
            if ($request->header('X-Inertia')) {
                return Inertia::location(route('login'));
            }

            // Requête navigateur classique
            return redirect()
                ->guest(route('login'))
                ->with('error', 'Votre session a expiré. Veuillez vous reconnecter.');
        }

        return parent::render($request, $exception);
    }
}
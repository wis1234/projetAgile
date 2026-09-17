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
        | 401 - Authentication expired
        |--------------------------------------------------------------------------
        */
        if ($exception instanceof AuthenticationException) {
            if ($request->header('X-Inertia')) {
                return Inertia::location(route('login'));
            }
            return redirect()->guest(route('login'));
        }

        $response = parent::render($request, $exception);
        $statusCode = $response->getStatusCode();

        // En mode debug local, conserver l'affichage par défaut de Laravel pour le debug des 500
        if (config('app.debug') && !in_array($statusCode, [403, 404, 419])) {
            return $response;
        }

        // Pour les requêtes Inertia ou requêtes HTML navigables
        if ($request->header('X-Inertia') || $request->acceptsHtml()) {
            if ($statusCode === 403) {
                return Inertia::render('Error403')
                    ->toResponse($request)
                    ->setStatusCode(403);
            }

            if ($statusCode === 404) {
                return Inertia::render('Error404')
                    ->toResponse($request)
                    ->setStatusCode(404);
            }

            if ($statusCode === 419 || $exception instanceof TokenMismatchException) {
                return Inertia::render('Error419', [
                    'status' => 419,
                    'message' => 'Votre session a expiré. Veuillez vous reconnecter.',
                ])->toResponse($request)->setStatusCode(419);
            }

            if ($statusCode === 500) {
                return Inertia::render('Error500')
                    ->toResponse($request)
                    ->setStatusCode(500);
            }

            if (in_array($statusCode, [503, 429])) {
                return Inertia::render('Error', [
                    'status' => $statusCode,
                    'message' => $exception->getMessage() ?: null,
                ])->toResponse($request)->setStatusCode($statusCode);
            }
        }

        return $response;
    }
}
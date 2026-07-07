<?php

namespace App\Exceptions;

use Inertia\Inertia;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler; // ← CORRECT
use Throwable;

class Handler extends ExceptionHandler // ← étend le bon parent
{
    public function render($request, Throwable $exception)
    {
        // ── 403 Accès refusé ─────────────────────────────────
        if ($exception instanceof \Symfony\Component\HttpKernel\Exception\HttpException 
            && $exception->getStatusCode() === 403) {
            if ($request->hasHeader('X-Inertia')) {
                return Inertia::render('Error403')
                    ->toResponse($request)
                    ->setStatusCode(403);
            }
        }

        // ── 419 CSRF expiré ───────────────────────────────────
        if ($exception instanceof TokenMismatchException) {
            if ($request->hasHeader('X-Inertia')) {
                // Header X-Inertia-Location → Inertia fait une vraie navigation
                return response()->json(
                    ['message' => 'Session expirée'],
                    419
                )->header('X-Inertia-Location', url('/login'));
            }
            return redirect()->route('login')
                ->with('error', 'Session expirée. Veuillez vous reconnecter.');
        }

        // ── 401 Session expirée / non authentifié ────────────
        if ($exception instanceof AuthenticationException) {
            if ($request->hasHeader('X-Inertia')) {
                // Même chose → navigation propre vers login
                return response()->json(
                    ['message' => 'Non authentifié'],
                    401
                )->header('X-Inertia-Location', url('/login'));
            }
            return redirect()->route('login')
                ->with('error', 'Veuillez vous connecter pour accéder à cette page.');
        }

        return parent::render($request, $exception);
    }
}
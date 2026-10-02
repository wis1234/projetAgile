<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Session\Middleware\StartSession;
use Illuminate\Cookie\Middleware\EncryptCookies;
use Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse;
use Illuminate\View\Middleware\ShareErrorsFromSession;
use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken;

return Application::configure(basePath: dirname(__DIR__))
    ->withProviders([
        \App\Providers\DropboxServiceProvider::class,
        \Spatie\Permission\PermissionServiceProvider::class,
        \App\Providers\EmailVerificationServiceProvider::class,
    ])
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Middleware web par défaut
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \App\Http\Middleware\RestrictQuizCandidateAccounts::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        // Désactiver la vérification CSRF pour les routes API
        $middleware->validateCsrfTokens(except: [
            'webhooks/fedapay/payouts',
            'api/*',
            'webhook/*',
            'stripe/*',
            'webhook',
            'webhook/*',
            'webhooks/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Session / jeton CSRF expiré (419).
        // Laravel convertit TokenMismatchException en HttpException(419) avant d'appeler les renderers :
        // on traite donc les deux formes. Pour une navigation Inertia, on RENVOIE l'utilisateur sur la page
        // qu'il quittait avec un message (le formulaire reste rempli) au lieu de le jeter sur /login sans explication.
        $exceptions->render(function (\Throwable $e, $request) {
            $isCsrf = $e instanceof \Illuminate\Session\TokenMismatchException
                || ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface && $e->getStatusCode() === 419);

            if (!$isCsrf) {
                return null;
            }

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with(
                    'error',
                    'Votre session de sécurité a expiré. Nous l\'avons renouvelée : veuillez réessayer.'
                );
            }

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'CSRF token mismatch. Please refresh the page and try again.',
                    'requiresPageReload' => true,
                ], 419);
            }

            return null;
        });

        // Pages d'erreur dédiées (404 / 403 / 500) : évite le chargement infini ou la modale HTML brute d'Inertia.
        $exceptions->render(function (\Throwable $e, $request) {
            if ($request->expectsJson() && !$request->header('X-Inertia')) {
                return null; // les API gardent leurs réponses JSON
            }

            $status = null;
            if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException
                || $e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                $status = 404;
            } elseif ($e instanceof \Illuminate\Auth\Access\AuthorizationException
                || ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface && $e->getStatusCode() === 403)) {
                $status = 403;
            } elseif (!config('app.debug') && !($e instanceof \Illuminate\Validation\ValidationException)
                && !($e instanceof \Illuminate\Auth\AuthenticationException)
                && !($e instanceof \Symfony\Component\HttpKernel\Exception\HttpExceptionInterface)) {
                $status = 500;
            }

            if (!$status) {
                return null;
            }

            return \Inertia\Inertia::render("Error{$status}")->toResponse($request)->setStatusCode($status);
        });
    })->create();

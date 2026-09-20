<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\Response;

/**
 * Un compte « candidat » (inscrit à des quiz, sans projet ni droit d'administration) n'a accès
 * qu'aux quiz, à son profil, à ses notifications et à la déconnexion. Masquer le menu ne suffit pas :
 * toute autre page est refusée ici, côté serveur.
 */
class RestrictQuizCandidateAccounts
{
    /** Chemins autorisés (motifs Str::is). */
    private const ALLOWED = [
        // Quiz
        'quizzes', 'quizzes/*',
        'quiz-attempts/*',
        'q/*',
        // Compte
        'profile', 'profile/*', 'password', 'logout', 'more',
        'notifications', 'activities/notifications', 'activities/notifications/*',
        'user/discussion-email-sharing',
        'device-tokens', 'push/subscribe', 'push/unsubscribe', 'broadcasting/auth',
        // Technique / authentification
        'csrf-token', 'sanctum/csrf-cookie', 'up', '403', '404', '419', '500', 'storage/*',
        'email/verification-notification', 'verify-email', 'verify-email/*', 'confirm-password',
        'login', 'register', 'forgot-password', 'reset-password', 'reset-password/*',
        // Pages publiques d'information
        'about', 'contact', 'guide', 'privacy-policy', 'terms-of-service',
    ];

    /** Chemins autorisés définis par expression régulière (le « * » de Str::is traverse les « / »). */
    private const ALLOWED_REGEX = [
        '#^projects/\d+/quizzes(/.*)?$#',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->isQuizCandidateOnly() || $this->isAllowed($request)) {
            return $next($request);
        }

        if ($request->expectsJson() && ! $request->header('X-Inertia')) {
            return response()->json(['message' => 'Votre compte candidat donne accès aux quiz uniquement.'], 403);
        }

        return redirect()->route('quizzes.index');
    }

    private function isAllowed(Request $request): bool
    {
        $path = trim($request->path(), '/');

        foreach (self::ALLOWED as $pattern) {
            if (Str::is($pattern, $path)) {
                return true;
            }
        }

        foreach (self::ALLOWED_REGEX as $regex) {
            if (preg_match($regex, $path)) {
                return true;
            }
        }

        return false;
    }
}

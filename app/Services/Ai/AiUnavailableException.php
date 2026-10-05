<?php

namespace App\Services\Ai;

/**
 * Erreur « présentable » à l'utilisateur (message déjà rédigé en français).
 * `errorCode` / `pauseSeconds` alimentent le coupe-circuit : un quota atteint, une clé refusée ou un crédit épuisé
 * met le fournisseur en pause quelques minutes au lieu de lui renvoyer chaque requête.
 */
class AiUnavailableException extends \RuntimeException
{
    public function __construct(string $message = '', public string $errorCode = 'unavailable', public int $pauseSeconds = 0, public ?int $httpStatus = null)
    {
        parent::__construct($message);
    }

    /** Code et durée de pause d'après le statut HTTP du fournisseur. */
    public static function classify(int $status, ?string $retryAfter = null): array
    {
        return match (true) {
            $status === 401 || $status === 403 => ['auth', 3600],
            $status === 402 => ['credits', 3600],
            $status === 429 => ['rate_limit', is_numeric($retryAfter) ? max(30, min(3600, (int) $retryAfter)) : 120],
            $status === 404 => ['model', 3600],
            $status === 408 || $status === 529 || $status >= 500 => ['unavailable', 60],
            default => ['bad_request', 0],
        };
    }
}

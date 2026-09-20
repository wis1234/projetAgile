<?php

namespace App\Services\Auth;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Throwable;

/**
 * Vérification serveur du reCAPTCHA Google, avec des messages clairs pour l'utilisateur.
 */
class RecaptchaVerifier
{
    /**
     * Clé secrète historique du projet, conservée en dernier recours pour ne rien casser en production.
     * Renseignez RECAPTCHA_SECRET_KEY dans le .env : ce repli pourra alors être supprimé.
     */
    private const LEGACY_SECRET = '6Lcvg8krAAAAADCaicd7FIRDZNKxXPPgWKcq-K6e';

    private const MESSAGES = [
        'missing-input-response' => 'Cochez la case « Je ne suis pas un robot » avant de continuer.',
        'invalid-input-response' => 'La vérification est invalide. Cochez à nouveau la case « Je ne suis pas un robot ».',
        'timeout-or-duplicate' => 'La vérification a expiré. Cochez à nouveau la case « Je ne suis pas un robot ».',
        'missing-input-secret' => 'La vérification de sécurité est mal configurée. Contactez le support.',
        'invalid-input-secret' => 'La vérification de sécurité est mal configurée. Contactez le support.',
        'bad-request' => 'La vérification a échoué. Rechargez la page puis réessayez.',
    ];

    /**
     * @return array{ok:bool, message:?string}
     */
    public function verify(?string $token, ?string $ip = null): array
    {
        if (blank($token)) {
            return $this->fail(self::MESSAGES['missing-input-response']);
        }

        try {
            $response = Http::timeout(8)
                ->retry(1, 300, throw: false)
                ->asForm()
                ->post('https://www.google.com/recaptcha/api/siteverify', [
                    'secret' => config('services.recaptcha.secret_key') ?: self::LEGACY_SECRET,
                    'response' => $token,
                    'remoteip' => $ip,
                ]);
        } catch (ConnectionException $e) {
            Log::warning('reCAPTCHA injoignable', ['message' => $e->getMessage()]);

            return $this->fail('Le service de vérification est momentanément injoignable. Réessayez dans quelques secondes.');
        } catch (Throwable $e) {
            report($e);

            return $this->fail('La vérification de sécurité a rencontré une erreur. Réessayez dans quelques secondes.');
        }

        if (!$response->successful()) {
            Log::error('Réponse reCAPTCHA en erreur', ['status' => $response->status()]);

            return $this->fail('Le service de vérification est momentanément indisponible. Réessayez dans quelques secondes.');
        }

        $data = $response->json() ?? [];

        if (!($data['success'] ?? false)) {
            $codes = (array) ($data['error-codes'] ?? []);
            Log::warning('Échec reCAPTCHA', ['codes' => $codes, 'ip' => $ip]);

            foreach ($codes as $code) {
                if (isset(self::MESSAGES[$code])) {
                    return $this->fail(self::MESSAGES[$code]);
                }
            }

            return $this->fail('La vérification de sécurité a échoué. Cochez à nouveau la case « Je ne suis pas un robot ».');
        }

        // reCAPTCHA v3 uniquement : le v2 « case à cocher » ne renvoie pas de score.
        if (isset($data['score']) && (float) $data['score'] < (float) config('services.recaptcha.score_threshold', 0.5)) {
            return $this->fail('Activité suspecte détectée. Réessayez dans quelques instants.');
        }

        return ['ok' => true, 'message' => null];
    }

    private function fail(string $message): array
    {
        return ['ok' => false, 'message' => $message];
    }
}

<?php

namespace App\Rules;

use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class RecaptchaRule implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        // En environnement local, on saute la validation si le débogage est activé et qu'aucune clé n'est définie
        if (config('recaptcha.debug') && !config('recaptcha.secret_key')) {
            return;
        }

        // Vérification du token reCAPTCHA
        $response = Http::asForm()->post(
            config('recaptcha.verify_url', 'https://www.google.com/recaptcha/api/siteverify'),
            [
                'secret' => config('recaptcha.secret_key'),
                'response' => $value,
                'remoteip' => request()->ip(),
            ]
        );

        // En cas d'échec de la requête
        if (!$response->successful()) {
            Log::error('Erreur lors de la requête reCAPTCHA', [
                'status' => $response->status(),
                'body' => $response->body(),
                'ip' => request()->ip(),
            ]);
            
            $fail('Une erreur est survenue lors de la vérification de sécurité. Veuillez réessayer.');
            return;
        }

        $responseData = $response->json();
        
        // Journalisation en cas d'erreur reCAPTCHA
        if (empty($responseData['success'])) {
            Log::warning('Échec de la vérification reCAPTCHA', [
                'errors' => $responseData['error-codes'] ?? 'Inconnu',
                'ip' => request()->ip(),
                'action' => $responseData['action'] ?? 'inconnue',
                'hostname' => $responseData['hostname'] ?? null,
            ]);
            
            $fail('La vérification de sécurité a échoué. Veuillez réessayer.');
            return;
        }

        // Vérification du score
        $action = $responseData['action'] ?? 'default';
        $score = (float) ($responseData['score'] ?? 0);
        
        // Déterminer le seuil en fonction de l'action
        $thresholds = config('recaptcha.action_thresholds', []);
        $threshold = $thresholds[$action] ?? config('recaptcha.score_threshold', 0.5);
        
        if ($score < $threshold) {
            Log::warning('Score reCAPTCHA trop faible', [
                'score' => $score,
                'threshold' => $threshold,
                'action' => $action,
                'ip' => request()->ip(),
                'hostname' => $responseData['hostname'] ?? null,
            ]);
            
            $fail('Activité suspecte détectée. Veuillez réessayer.');
        }
    }
}

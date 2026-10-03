<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/** Client minimal de l'API Messages d'Anthropic (appel d'outils compris). Aucune dépendance supplémentaire. */
class AnthropicClient
{
    public function configured(): bool
    {
        return (bool) config('services.ai.api_key');
    }

    /**
     * @param array $system   texte du prompt système
     * @param array $messages messages au format Anthropic
     * @param array $tools    définitions d'outils (name, description, input_schema)
     * @return array          corps de réponse décodé
     * @throws AiUnavailableException
     */
    public function send(string $system, array $messages, array $tools): array
    {
        $payload = [
            'model' => config('services.ai.model'),
            'max_tokens' => config('services.ai.max_tokens'),
            'system' => $system,
            'messages' => $messages,
        ];
        if ($tools) {
            $payload['tools'] = $tools;
        }

        try {
            $response = Http::withHeaders([
                'x-api-key' => config('services.ai.api_key'),
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])->timeout(config('services.ai.timeout', 90))->post('https://api.anthropic.com/v1/messages', $payload);
        } catch (\Throwable $e) {
            Log::error('AI: connexion impossible', ['error' => $e->getMessage()]);
            throw new AiUnavailableException("Impossible de joindre le service d'IA. Réessayez dans un instant.");
        }

        if ($response->failed()) {
            Log::error('AI: erreur API', ['status' => $response->status(), 'body' => mb_substr($response->body(), 0, 600)]);
            $status = $response->status();
            throw new AiUnavailableException(match (true) {
                in_array($status, [401, 403], true) => "La clé du service d'IA est invalide ou non autorisée. Contactez un administrateur.",
                $status === 429 => "L'assistant est très sollicité en ce moment. Réessayez dans une minute.",
                $status === 529 || $status >= 500 => "Le service d'IA est momentanément indisponible. Réessayez dans un instant.",
                default => "L'assistant n'a pas pu répondre (erreur {$status}).",
            });
        }

        return $response->json() ?? [];
    }
}

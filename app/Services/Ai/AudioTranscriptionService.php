<?php

namespace App\Services\Ai;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AudioTranscriptionService
{
    public function configuredProviders(): array
    {
        $providers = (array) config('services.ai.transcription_providers', []);
        $order = (array) config('services.ai.transcription_order', ['groq', 'openai']);

        return collect($order)
            ->filter(fn ($name) => isset($providers[$name]))
            ->unique()
            ->map(fn ($name) => [
                'name' => $name,
                'model' => $providers[$name]['model'],
                'available' => filled($providers[$name]['api_key'] ?? null),
            ])
            ->values()
            ->all();
    }

    public function transcribe(UploadedFile $audio): array
    {
        $providers = (array) config('services.ai.transcription_providers', []);
        $failures = [];

        foreach ((array) config('services.ai.transcription_order', ['groq', 'openai']) as $name) {
            $provider = $providers[$name] ?? null;
            if (!is_array($provider) || blank($provider['api_key'] ?? null) || blank($provider['base_url'] ?? null) || blank($provider['model'] ?? null)) {
                continue;
            }

            try {
                $contents = file_get_contents($audio->getRealPath());
                if (!is_string($contents)) {
                    throw new AiUnavailableException('Le fichier audio n’a pas pu être lu.');
                }

                $response = Http::timeout((int) config('services.ai.timeout', 90))
                    ->withToken($provider['api_key'])
                    ->attach(
                        'file',
                        $contents,
                        $audio->getClientOriginalName() ?: 'message-vocal.webm',
                        ['Content-Type' => $audio->getMimeType() ?: 'application/octet-stream']
                    )
                    ->post(rtrim($provider['base_url'], '/') . '/audio/transcriptions', [
                        'model' => $provider['model'],
                        'response_format' => 'json',
                        'language' => 'fr',
                    ]);

                if ($response->failed()) {
                    Log::warning('AI transcription provider failed', [
                        'provider' => $name,
                        'model' => $provider['model'],
                        'status' => $response->status(),
                    ]);
                    $failures[] = $name;
                    continue;
                }

                $transcript = trim((string) $response->json('text', ''));
                if ($transcript === '') {
                    $failures[] = $name;
                    continue;
                }

                return [
                    'text' => mb_substr($transcript, 0, 2000),
                    'provider' => $name,
                    'model' => $provider['model'],
                ];
            } catch (\Throwable $e) {
                Log::warning('AI transcription request unavailable', [
                    'provider' => $name,
                    'error' => $e->getMessage(),
                ]);
                $failures[] = $name;
            }
        }

        throw new AiUnavailableException(
            $failures
                ? 'La transcription vocale est momentanément indisponible. Réessayez ou saisissez votre message.'
                : 'Aucun service de transcription n’est configuré. Contactez un administrateur.'
        );
    }
}

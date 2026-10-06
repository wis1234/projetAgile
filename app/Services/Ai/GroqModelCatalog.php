<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/** Fetches models visible to the configured Groq key and selects a chat/tool-compatible model. */
class GroqModelCatalog
{
    /**
     * @return array<int,array{id:string,context_window?:int,supported_parameters?:array,capabilities?:array,active?:bool}>|null
     */
    public function models(array $config, bool $refresh = false): ?array
    {
        $apiKey = trim((string) ($config['api_key'] ?? ''));
        $baseUrl = rtrim((string) ($config['base_url'] ?? ''), '/');
        if ($apiKey === '' || $baseUrl === '') {
            return null;
        }

        $key = 'ai:groq:models:' . hash('sha256', $apiKey . '|' . $baseUrl);
        if (!$refresh && Cache::has($key)) {
            return Cache::get($key);
        }

        try {
            $response = Http::acceptJson()->withToken($apiKey)->timeout(12)->get($baseUrl . '/models');
            if ($response->failed()) {
                Log::notice('Groq model catalog request failed', ['status' => $response->status()]);
                return null;
            }

            $rows = $response->json('data');
            if (!is_array($rows)) {
                return null;
            }

            $models = array_values(array_filter($rows, fn ($model) => is_array($model) && is_string($model['id'] ?? null)));
            Cache::put($key, $models, now()->addMinutes(5));

            return $models;
        } catch (\Throwable $e) {
            Log::notice('Groq model catalog unavailable', ['error' => $e->getMessage()]);
            return null;
        }
    }

    /** @return array<int,array<string,mixed>> */
    public function toolModels(array $config, bool $refresh = false): array
    {
        return array_values(array_filter(
            $this->models($config, $refresh) ?? [],
            fn ($model) => $this->isUsable($model, true)
        ));
    }

    public function resolve(array $config, bool $requiresTools = true, bool $refresh = false): string
    {
        $configured = trim((string) ($config['model'] ?? ''));
        $models = $this->models($config, $refresh);
        if ($models === null) {
            // Preserve compatibility during a transient catalog outage; the chat call
            // itself will produce the actionable Groq error if the model is invalid.
            return $configured;
        }

        $compatible = array_values(array_filter($models, fn ($model) => $this->isUsable($model, $requiresTools)));
        foreach ($compatible as $model) {
            if (($model['id'] ?? null) === $configured) {
                return $configured;
            }
        }

        $preferences = array_values(array_filter(array_map('trim', explode(',', (string) config('services.ai.groq_model_preferences', '')))));
        foreach ($preferences as $preferred) {
            foreach ($compatible as $model) {
                if (($model['id'] ?? null) === $preferred) {
                    return $preferred;
                }
            }
        }

        usort($compatible, fn ($a, $b) => (int) ($b['context_window'] ?? 0) <=> (int) ($a['context_window'] ?? 0));
        if (isset($compatible[0]['id'])) {
            return $compatible[0]['id'];
        }

        throw new AiUnavailableException(
            $requiresTools
                ? 'Groq ne propose aucun modèle actif compatible avec les appels d’outils requis par ProJA.'
                : 'Aucun modèle Groq actif n’est disponible pour cette clé.',
            'model',
            300
        );
    }

    /** @return array<int,string> */
    public function toolCompatibleModelIds(array $config, bool $refresh = false): array
    {
        $models = $this->models($config, $refresh) ?? [];

        return array_values(array_map(
            fn ($model) => $model['id'],
            array_filter($models, fn ($model) => $this->isUsable($model, true))
        ));
    }

    private function isUsable(array $model, bool $requiresTools): bool
    {
        if (($model['active'] ?? true) === false || empty($model['id'])) {
            return false;
        }
        if (!$requiresTools) {
            return true;
        }

        $parameters = $model['supported_parameters'] ?? null;
        $capabilities = $model['capabilities'] ?? [];
        if (is_array($parameters)) {
            return in_array('tools', $parameters, true)
                && in_array('tool_choice', $parameters, true);
        }

        return (bool) ($capabilities['supports_tools'] ?? $capabilities['function_calling'] ?? false)
            && (bool) ($capabilities['supports_tool_choice'] ?? true);
    }
}

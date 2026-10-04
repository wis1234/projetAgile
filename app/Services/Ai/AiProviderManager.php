<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;

class AiProviderManager
{
    private ?string $lastProvider = null;
    private ?string $lastModel = null;
    private array $lastUsage = [];

    public function __construct(
        private AnthropicClient $anthropic,
        private OpenAiCompatibleClient $openAi,
        private AiSettingsService $settings,
    ) {
    }

    public function configured(): bool
    {
        if (!(bool) config('services.ai.enabled', true) || !$this->settings->global()->enabled) {
            return false;
        }
        foreach ($this->settings->activeProviderOrder() as $name) {
            if ($this->isConfigured($name)) {
                return true;
            }
        }

        return false;
    }

    public function availableProviders(): array
    {
        return $this->settings->providers();
    }

    public function currentProvider(): ?string
    {
        return $this->lastProvider;
    }

    public function currentModel(): ?string
    {
        return $this->lastModel;
    }

    public function currentUsage(): array
    {
        return $this->lastUsage;
    }

    public function send(string $system, array $messages, array $tools): array
    {
        $settings = $this->settings->global();
        $failures = [];
        foreach ($this->settings->activeProviderOrder() as $name) {
            if (!$this->isConfigured($name)) {
                continue;
            }
            $providerConfig = config("services.ai.providers.{$name}", []);
            try {
                $response = $name === 'anthropic'
                    ? $this->anthropic->send($system, $messages, $tools, $providerConfig, (int) $settings->max_tokens, (int) $settings->timeout)
                    : $this->openAi->send($name, $providerConfig, $system, $messages, $tools, (int) $settings->max_tokens, (int) $settings->timeout);
                $this->lastProvider = $name;
                $this->lastModel = $providerConfig['model'] ?? null;
                $this->lastUsage = $response['usage'] ?? [];

                return $response;
            } catch (AiUnavailableException $e) {
                $failures[] = "{$name}: {$e->getMessage()}";
                Log::notice('AI: bascule vers le fournisseur de secours', ['provider' => $name]);
            }
        }

        throw new AiUnavailableException(
            $failures
                ? "Tous les fournisseurs d'IA configurés sont momentanément indisponibles. Réessayez dans un instant."
                : "Aucun fournisseur d'IA n'est configuré. Configurez une clé API ou un serveur Ollama."
        );
    }

    private function isConfigured(string $name): bool
    {
        $provider = config("services.ai.providers.{$name}");
        if (!is_array($provider) || empty($provider['model']) || empty($provider['base_url'])) {
            return false;
        }

        return $name === 'ollama'
            ? (bool) ($provider['enabled'] ?? false)
            : filled($provider['api_key'] ?? null);
    }
}

<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Log;

class AiProviderManager
{
    private ?string $lastProvider = null;
    private ?string $lastModel = null;
    private array $lastUsage = [];
    private ?string $turnProvider = null;

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
        $order = $this->settings->activeProviderOrder();

        // Once a provider has returned a response, keep the complete tool round-trip
        // on that provider. This avoids repeating OpenRouter's exhausted 429 for every
        // tool step and prevents provider-specific tool metadata being sent elsewhere.
        if ($this->turnProvider !== null) {
            $order = [$this->turnProvider];
        }

        foreach ($order as $name) {
            if (!$this->isConfigured($name)) {
                continue;
            }
            $providerConfig = config("services.ai.providers.{$name}", []);
            try {
                $response = match ($name) {
                    'anthropic' => $this->anthropic->send($system, $messages, $tools, $providerConfig, (int) $settings->max_tokens, (int) $settings->timeout),
                    default => $this->openAi->send($name, $providerConfig, $system, $messages, $tools, (int) $settings->max_tokens, (int) $settings->timeout),
                };
                $this->lastProvider = $name;
                $this->lastModel = $providerConfig['model'] ?? null;
                $this->lastUsage = $response['usage'] ?? [];
                $this->turnProvider ??= $name;

                return $response;
            } catch (AiUnavailableException $e) {
                $failures[] = "{$name}: {$e->getMessage()}";
                Log::notice('AI: bascule vers le fournisseur de secours', ['provider' => $name]);
            }
        }

        throw new AiUnavailableException($failures
            ? "Le fournisseur IA {$this->turnProvider} est indisponible pendant l'exécution. " . implode(' ; ', $failures)
            : "Aucun fournisseur d'IA n'est configuré. Configurez une clé API ou un serveur Ollama."
        );
    }

    private function isConfigured(string $name): bool
    {
        $provider = config("services.ai.providers.{$name}");
        if (!is_array($provider) || empty($provider['model']) || empty($provider['base_url'])) {
            return false;
        }

        return match ($name) {
            'ollama' => (bool) ($provider['enabled'] ?? false),
            'cloudflare' => filled($provider['account_id'] ?? null) && filled($provider['api_key'] ?? null),
            default => filled($provider['api_key'] ?? null),
        };
    }
}

<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class AiProviderManager
{
    private ?string $lastProvider = null;
    private ?string $lastModel = null;
    private array $lastUsage = [];
    private ?string $turnProvider = null;
    /** @var array<int,array{provider:string,ok:bool,code:?string,ms:int}> */
    private array $attempts = [];

    public function __construct(
        private AnthropicClient $anthropic,
        private OpenAiCompatibleClient $openAi,
        private GroqModelCatalog $groqModels,
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

    public function attempts(): array
    {
        return $this->attempts;
    }

    /** Nombre de fournisseurs essayés en échec avant celui qui a répondu (bascules). */
    public function fallbackCount(): int
    {
        return count(array_filter($this->attempts, fn ($a) => !$a['ok']));
    }

    /** À appeler au début de chaque message utilisateur : un nouveau tour peut re-choisir son fournisseur. */
    public function beginTurn(): void
    {
        $this->turnProvider = null;
        $this->attempts = [];
        $this->lastProvider = $this->lastModel = null;
        $this->lastUsage = [];
    }

    // ───────────── Coupe-circuit ─────────────

    public function circuit(string $name): ?array
    {
        $c = Cache::get("ai:cb:{$name}");
        return is_array($c) && ($c['until'] ?? 0) > time() ? $c : null;
    }

    public function resetCircuit(string $name): void
    {
        Cache::forget("ai:cb:{$name}");
    }

    private function trip(string $name, string $code, int $seconds): void
    {
        Cache::put("ai:cb:{$name}", ['until' => time() + $seconds, 'code' => $code], $seconds + 5);
    }

    private function remember(string $name, bool $ok, ?string $code = null, ?string $message = null): void
    {
        Cache::put("ai:last:{$name}", ['ok' => $ok, 'code' => $code, 'message' => $message ? mb_substr($message, 0, 240) : null, 'at' => now()->toIso8601String()], 7 * 86400);
        if ($ok) {
            Cache::put("ai:ok:{$name}", now()->toIso8601String(), 7 * 86400);
        }
    }

    /** Test manuel depuis le tableau de bord : quelques jetons, indépendant de l'activation et de la pause. */
    public function ping(string $name): array
    {
        if (!$this->isConfigured($name)) {
            return ['ok' => false, 'message' => 'Fournisseur non configuré (clé ou URL manquante).', 'ms' => 0];
        }
        $cfg = config("services.ai.providers.{$name}", []);
        $started = microtime(true);
        try {
            $messages = [['role' => 'user', 'content' => 'Réponds uniquement par le mot : ok']];
            $response = $name === 'anthropic'
                ? $this->anthropic->send('Test de connexion.', $messages, [], $cfg, 24, 25)
                : $this->openAi->send($name, $cfg, 'Test de connexion.', $messages, [], 24, 25);
            $text = trim(collect($response['content'] ?? [])->where('type', 'text')->pluck('text')->implode(' '));
            $this->remember($name, true);
            $this->resetCircuit($name);

            $model = $response['model'] ?? $cfg['model'];
            return ['ok' => true, 'message' => ($text !== '' ? 'Réponse reçue : « ' . mb_substr($text, 0, 40) . ' »' : 'Connexion réussie.') . " · modèle {$model}", 'ms' => (int) ((microtime(true) - $started) * 1000)];
        } catch (AiUnavailableException $e) {
            $this->remember($name, false, $e->errorCode, $e->getMessage());
            return ['ok' => false, 'message' => $e->getMessage(), 'code' => $e->errorCode, 'ms' => (int) ((microtime(true) - $started) * 1000)];
        }
    }

    /** État de santé de chaque fournisseur (dans l'ordre de bascule) pour le tableau de bord. */
    public function health(): array
    {
        $enabled = $this->settings->enabledProviderNames();
        $rows = [];
        foreach ($this->settings->providerOrder() as $i => $name) {
            $cfg = config("services.ai.providers.{$name}", []);
            $cb = $this->circuit($name);
            $row = [
                'name' => $name,
                'label' => $cfg['label'] ?? ucfirst($name),
                'model' => (string) ($cfg['model'] ?? ''),
                'free' => in_array($name, ['openrouter', 'gemini', 'groq', 'cloudflare', 'ollama', 'mistral'], true),
                'configured' => $this->isConfigured($name),
                'enabled' => in_array($name, $enabled, true),
                'position' => $i + 1,
                'paused' => $cb ? ['code' => $cb['code'], 'seconds' => max(0, $cb['until'] - time())] : null,
                'last' => Cache::get("ai:last:{$name}"),
                'last_ok_at' => Cache::get("ai:ok:{$name}"),
            ];
            if ($name === 'groq' && $row['configured']) {
                $row['configured_model'] = (string) ($cfg['model'] ?? '');
                $row['catalog_models'] = array_map(
                    fn ($model) => [
                        'id' => $model['id'],
                        'context_window' => $model['context_window'] ?? null,
                    ],
                    $this->groqModels->toolModels($cfg)
                );
                try {
                    $row['model'] = $this->groqModels->resolve($cfg, true);
                } catch (AiUnavailableException $e) {
                    $row['catalog_error'] = $e->getMessage();
                }
            }
            $rows[] = $row;
        }

        return $rows;
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
        } else {
            $ready = array_values(array_filter($order, fn ($n) => $this->isConfigured($n) && !$this->circuit($n)));
            // Tous en pause : on retente quand même plutôt que d'échouer sans essayer
            $order = $ready ?: $order;
        }

        foreach ($order as $name) {
            if (!$this->isConfigured($name)) {
                continue;
            }
            $providerConfig = config("services.ai.providers.{$name}", []);
            $started = microtime(true);
            try {
                $response = match ($name) {
                    'anthropic' => $this->anthropic->send($system, $messages, $tools, $providerConfig, (int) $settings->max_tokens, (int) $settings->timeout),
                    default => $this->openAi->send($name, $providerConfig, $system, $messages, $tools, (int) $settings->max_tokens, (int) $settings->timeout),
                };
                $this->lastProvider = $name;
                $this->lastModel = $response['model'] ?? $providerConfig['model'] ?? null;
                $this->lastUsage = $response['usage'] ?? [];
                $this->turnProvider ??= $name;
                $this->attempts[] = ['provider' => $name, 'ok' => true, 'code' => null, 'ms' => (int) ((microtime(true) - $started) * 1000)];
                $this->remember($name, true);
                $this->resetCircuit($name);

                return $response;
            } catch (AiUnavailableException $e) {
                $failures[] = "{$name}: {$e->getMessage()}";
                $this->attempts[] = ['provider' => $name, 'ok' => false, 'code' => $e->errorCode, 'ms' => (int) ((microtime(true) - $started) * 1000)];
                $this->remember($name, false, $e->errorCode, $e->getMessage());
                if ($e->pauseSeconds > 0) {
                    $this->trip($name, $e->errorCode, $e->pauseSeconds);
                }
                Log::notice('AI: bascule vers le fournisseur de secours', ['provider' => $name]);
            }
        }

        throw new AiUnavailableException($failures
            ? "Le fournisseur IA {$this->turnProvider} est indisponible pendant l'exécution. " . implode(' ; ', $failures)
            : "Aucun fournisseur d'IA n'est configuré. Configurez une clé API ou un serveur Ollama."
        );
    }

    public function isConfigured(string $name): bool
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

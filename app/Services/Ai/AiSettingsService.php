<?php

namespace App\Services\Ai;

use App\Models\AiSetting;
use App\Models\AiUserSetting;
use App\Models\User;
use App\Models\AiUsage;
use Illuminate\Support\Facades\Cache;

class AiSettingsService
{
    public function global(): AiSetting
    {
        return Cache::remember('ai:settings:global', 30, function () {
            return AiSetting::firstOrCreate(['id' => 1], [
                'enabled' => (bool) config('services.ai.enabled', true),
                'daily_limit' => (int) config('services.ai.daily_limit', 100),
                'max_tokens' => (int) config('services.ai.max_tokens', 1800),
                'timeout' => (int) config('services.ai.timeout', 90),
                'provider_order' => config('services.ai.provider_order', ['openrouter', 'gemini', 'anthropic', 'openai', 'groq', 'ollama']),
                'enabled_providers' => $this->defaultEnabledProviders(),
            ]);
        });
    }

    public function updateGlobal(array $data): AiSetting
    {
        $settings = AiSetting::firstOrCreate(['id' => 1]);
        $settings->fill($data)->save();
        Cache::forget('ai:settings:global');

        return $settings->fresh();
    }

    public function userSettings(User $user): ?AiUserSetting
    {
        return AiUserSetting::where('user_id', $user->id)->first();
    }

    public function limitFor(User $user): int
    {
        $global = $this->global();
        $userSettings = $this->userSettings($user);

        return max(0, (int) ($userSettings?->daily_limit ?? $global->daily_limit));
    }

    /** Messages (chat) déjà consommés aujourd'hui : en cours + réussis. Les échecs ne consomment pas le quota. */
    public function usedToday(User $user, string $kind = 'chat'): int
    {
        return AiUsage::where('user_id', $user->id)->where('kind', $kind)
            ->where('created_at', '>=', now()->startOfDay())
            ->where(function ($q) {
                // Une requête « en cours » depuis plus de 10 min est considérée interrompue : elle ne consomme plus le quota
                $q->where('status', 'success')
                    ->orWhere(fn ($w) => $w->where('status', 'started')->where('created_at', '>=', now()->subMinutes(10)));
            })->count();
    }

    public function remainingFor(User $user): int
    {
        return max(0, $this->limitFor($user) - $this->usedToday($user));
    }

    public function voiceEnabled(): bool
    {
        return (bool) ($this->global()->voice_enabled ?? true);
    }

    public function voiceLimit(): int
    {
        return max(0, (int) ($this->global()->voice_daily_limit ?? 50));
    }

    public function voiceRemainingFor(User $user): int
    {
        return max(0, $this->voiceLimit() - $this->usedToday($user, 'transcription'));
    }

    public function maxSteps(): int
    {
        return max(1, min(15, (int) ($this->global()->max_steps ?: config('services.ai.max_steps', 8))));
    }

    public function maxMessageChars(): int
    {
        return max(200, min(8000, (int) ($this->global()->max_message_chars ?: 2000)));
    }

    /** Capacités activables : lecture/écriture de fichiers, gestion des membres, rapports. */
    public function features(): array
    {
        $g = $this->global();
        return [
            'files_read' => (bool) ($g->files_read_enabled ?? true),
            'files_write' => (bool) ($g->files_write_enabled ?? true),
            'members' => (bool) ($g->members_manage_enabled ?? true),
            'reports' => (bool) ($g->reports_enabled ?? true),
        ];
    }

    public function customInstructions(): string
    {
        return trim((string) ($this->global()->custom_instructions ?? ''));
    }

    public function enabledFor(User $user): bool
    {
        return (bool) $this->global()->enabled && ($this->userSettings($user)?->enabled ?? true);
    }

    /** @return array<string, array{model:string, available:bool}> */
    public function providers(): array
    {
        $providers = (array) config('services.ai.providers', []);
        $available = [];
        foreach ($providers as $name => $provider) {
            $available[$name] = [
                'model' => (string) ($provider['model'] ?? ''),
                'available' => match ($name) {
                    'ollama' => (bool) ($provider['enabled'] ?? false),
                    'cloudflare' => filled($provider['account_id'] ?? null) && filled($provider['api_key'] ?? null),
                    default => filled($provider['api_key'] ?? null),
                },
            ];
        }

        return $available;
    }

    public function providerOrder(): array
    {
        $configured = array_keys($this->providers());
        $order = $this->global()->provider_order ?: $configured;
        $order = array_values(array_unique(array_filter($order, fn ($provider) => in_array($provider, $configured, true))));

        return array_values(array_merge($order, array_diff($configured, $order)));
    }

    public function enabledProviderNames(): array
    {
        $enabled = $this->global()->enabled_providers;
        if (!is_array($enabled)) {
            return $this->defaultEnabledProviders();
        }

        return array_values(array_unique(array_filter(
            $enabled,
            fn ($provider) => is_string($provider) && array_key_exists($provider, $this->providers())
        )));
    }

    public function activeProviderOrder(): array
    {
        $enabled = $this->enabledProviderNames();

        return array_values(array_filter($this->providerOrder(), fn ($provider) => in_array($provider, $enabled, true)));
    }

    private function defaultEnabledProviders(): array
    {
        return array_keys(array_filter($this->providers(), fn ($provider) => $provider['available']));
    }
}

<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/** Cloudflare Workers AI account-level /ai/run adapter (not the OpenAI-compatible endpoint). */
class CloudflareAiClient
{
    public function send(array $config, string $system, array $messages, array $tools, int $maxTokens, int $timeout): array
    {
        $accountId = trim((string) ($config['account_id'] ?? ''));
        $token = trim((string) ($config['api_key'] ?? ''));
        if ($accountId === '' || $token === '') {
            throw new AiUnavailableException('Cloudflare Workers AI requiert CLOUDFLARE_ACCOUNT_ID et CLOUDFLARE_AI_API_TOKEN.');
        }

        $payload = [
            'messages' => $this->messages($system, $messages),
            'max_tokens' => $maxTokens,
        ];
        if ($tools) {
            $payload['tools'] = array_map(fn ($tool) => [
                'name' => $tool['name'],
                'description' => $tool['description'],
                'parameters' => $tool['input_schema'],
            ], $tools);
        }

        $url = rtrim((string) $config['base_url'], '/') . '/run/' . rawurlencode((string) $config['model']);
        try {
            $response = Http::acceptJson()
                ->asJson()
                ->withToken($token)
                ->timeout($timeout)
                ->post($url, $payload);
        } catch (\Throwable $e) {
            Log::warning('Cloudflare Workers AI connection failed', ['error' => $e->getMessage()]);
            throw new AiUnavailableException('Cloudflare Workers AI ne répond pas.');
        }

        $json = $response->json();
        if ($response->failed() || ($json['success'] ?? true) === false) {
            $error = data_get($json, 'errors.0.message')
                ?? data_get($json, 'error.message')
                ?? 'Erreur Cloudflare Workers AI.';
            Log::warning('Cloudflare Workers AI request failed', [
                'model' => $config['model'],
                'status' => $response->status(),
                'message' => $error,
            ]);
            throw new AiUnavailableException(match ($response->status()) {
                401, 403 => 'Cloudflare refuse le jeton Workers AI. Vérifiez les permissions Workers AI Read/Edit et l’Account ID.',
                429 => 'Cloudflare Workers AI a atteint sa limite de requêtes ou son quota. ' . $error,
                default => 'Cloudflare Workers AI : ' . $error,
            });
        }

        $result = $json['result'] ?? $json;
        $blocks = [];
        $text = $result['response'] ?? $result['text'] ?? '';
        if (is_string($text) && trim($text) !== '') {
            $blocks[] = ['type' => 'text', 'text' => trim($text)];
        }

        foreach (($result['tool_calls'] ?? []) as $index => $call) {
            $name = $call['name'] ?? '';
            $input = $call['arguments'] ?? [];
            if (is_string($input)) {
                $input = json_decode($input, true);
            }
            if (!is_array($input)) {
                throw new AiUnavailableException('Cloudflare Workers AI a retourné des arguments d’outil mal formés.');
            }
            $blocks[] = [
                'type' => 'tool_use',
                'id' => 'cf_' . uniqid((string) $index, true),
                'name' => $name,
                'input' => $input,
            ];
        }

        return [
            'content' => $blocks,
            'stop_reason' => !empty($result['tool_calls']) ? 'tool_use' : 'end_turn',
            'usage' => [
                'input_tokens' => data_get($result, 'usage.prompt_tokens'),
                'output_tokens' => data_get($result, 'usage.completion_tokens'),
            ],
        ];
    }

    private function messages(string $system, array $messages): array
    {
        $out = [['role' => 'system', 'content' => $system]];

        foreach ($messages as $message) {
            $role = $message['role'] ?? 'user';
            $content = $message['content'] ?? '';
            if (!is_array($content)) {
                $out[] = ['role' => $role, 'content' => (string) $content];
                continue;
            }

            if ($role === 'assistant') {
                $parts = collect($content)->where('type', 'text')->pluck('text')->filter()->values()->all();
                $calls = collect($content)->where('type', 'tool_use')->map(fn ($block) => [
                    'name' => $block['name'] ?? '',
                    'arguments' => $block['input'] ?? new \stdClass(),
                ])->values()->all();
                if ($calls) {
                    $parts[] = json_encode(['tool_calls' => $calls], JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
                }
                $out[] = ['role' => 'assistant', 'content' => implode("\n", $parts)];
                continue;
            }

            $toolResults = collect($content)->where('type', 'tool_result');
            if ($toolResults->isNotEmpty()) {
                foreach ($toolResults as $toolResult) {
                    $out[] = [
                        'role' => 'tool',
                        'content' => (string) ($toolResult['content'] ?? ''),
                    ];
                }
                continue;
            }

            $out[] = ['role' => $role, 'content' => json_encode($content, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES) ?: ''];
        }

        return $out;
    }
}

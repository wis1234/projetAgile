<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class OpenAiCompatibleClient
{
    public function send(string $provider, array $config, string $system, array $messages, array $tools, int $maxTokens, int $timeout): array
    {
        $payload = [
            'model' => $config['model'],
            'max_tokens' => $maxTokens,
            'messages' => $this->messages($system, $messages),
        ];
        if ($tools) {
            $payload['tools'] = array_map(fn ($tool) => [
                'type' => 'function',
                'function' => [
                    'name' => $tool['name'],
                    'description' => $tool['description'],
                    'parameters' => $tool['input_schema'],
                ],
            ], $tools);
            $payload['tool_choice'] = 'auto';
        }

        try {
            $request = Http::acceptJson()->asJson()->timeout($timeout);
            if (filled($config['api_key'] ?? null)) {
                $request = $request->withToken($config['api_key']);
            }
            if ($provider === 'openrouter') {
                $request = $request->withHeaders([
                    'HTTP-Referer' => config('app.url'),
                    'X-Title' => config('app.name', 'ProJA'),
                ]);
            }
            $response = $request->post(rtrim($config['base_url'], '/') . '/chat/completions', $payload);
        } catch (\Throwable $e) {
            Log::warning('AI provider connection failed', ['provider' => $provider, 'error' => $e->getMessage()]);
            throw new AiUnavailableException("Le fournisseur {$provider} ne répond pas.");
        }

        if ($response->failed()) {
            Log::warning('AI provider request failed', [
                'provider' => $provider,
                'model' => $config['model'],
                'status' => $response->status(),
                'body' => mb_substr($response->body(), 0, 1500),
            ]);
            throw new AiUnavailableException("Le fournisseur {$provider} a refusé la requête (HTTP {$response->status()}).");
        }

        $json = $response->json();
        $choice = $json['choices'][0] ?? null;
        if (!is_array($choice) || !is_array($choice['message'] ?? null)) {
            throw new AiUnavailableException("Le fournisseur {$provider} a retourné une réponse invalide.");
        }

        $content = [];
        $text = $choice['message']['content'] ?? '';
        if (is_string($text) && $text !== '') {
            $content[] = ['type' => 'text', 'text' => $text];
        }
        foreach (($choice['message']['tool_calls'] ?? []) as $call) {
            $arguments = json_decode($call['function']['arguments'] ?? '{}', true);
            if (!is_array($arguments)) {
                throw new AiUnavailableException("Le fournisseur {$provider} a généré des paramètres d'action invalides.");
            }
            $content[] = [
                'type' => 'tool_use',
                'id' => $call['id'] ?? uniqid('call_', true),
                'name' => $call['function']['name'] ?? '',
                'input' => $arguments,
            ];
        }

        return [
            'content' => $content,
            'stop_reason' => !empty($choice['message']['tool_calls']) ? 'tool_use' : 'end_turn',
            'usage' => [
                'input_tokens' => $json['usage']['prompt_tokens'] ?? null,
                'output_tokens' => $json['usage']['completion_tokens'] ?? null,
            ],
        ];
    }

    private function messages(string $system, array $messages): array
    {
        $result = [['role' => 'system', 'content' => $system]];
        foreach ($messages as $message) {
            $content = $message['content'] ?? '';
            if (!is_array($content)) {
                $result[] = ['role' => $message['role'], 'content' => $content];
                continue;
            }

            if ($message['role'] === 'assistant') {
                $text = collect($content)->where('type', 'text')->pluck('text')->implode("\n");
                $calls = collect($content)->where('type', 'tool_use')->map(fn ($block) => [
                    'id' => $block['id'],
                    'type' => 'function',
                    'function' => [
                        'name' => $block['name'],
                        'arguments' => json_encode($block['input'] ?? new \stdClass(), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
                    ],
                ])->values()->all();
                $entry = ['role' => 'assistant', 'content' => $text !== '' ? $text : null];
                if ($calls) {
                    $entry['tool_calls'] = $calls;
                }
                $result[] = $entry;
                continue;
            }

            $toolResults = collect($content)->where('type', 'tool_result');
            if ($toolResults->isNotEmpty()) {
                foreach ($toolResults as $toolResult) {
                    $result[] = [
                        'role' => 'tool',
                        'tool_call_id' => $toolResult['tool_use_id'],
                        'content' => (string) ($toolResult['content'] ?? ''),
                    ];
                }
                continue;
            }
            $result[] = ['role' => $message['role'], 'content' => json_encode($content, JSON_UNESCAPED_UNICODE)];
        }

        return $result;
    }
}

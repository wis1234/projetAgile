<?php

namespace App\Services\Ai;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AnthropicClient
{
    public function configured(): bool
    {
        return (bool) config('services.ai.api_key');
    }

    public function send(
        string $system,
        array $messages,
        array $tools
    ): array {
        $payload = [
            'model' => config('services.ai.model'),
            'max_tokens' => config('services.ai.max_tokens'),
            'system' => $system,
            'messages' => $messages,
        ];

        if (!empty($tools)) {
            $payload['tools'] = $tools;
        }

        try {
            $response = Http::withHeaders([
                'x-api-key' => config('services.ai.api_key'),
                'anthropic-version' => '2023-06-01',
                'content-type' => 'application/json',
            ])
                ->timeout(
                    (int) config('services.ai.timeout', 90)
                )
                ->post(
                    'https://api.anthropic.com/v1/messages',
                    $payload
                );
        } catch (\Throwable $e) {
            Log::error('AI: connexion impossible', [
                'error' => $e->getMessage(),
                'model' => config('services.ai.model'),
            ]);

            throw new AiUnavailableException(
                "Impossible de joindre le service d'IA. Réessayez dans un instant."
            );
        }

        if ($response->failed()) {
            Log::error('AI: erreur API', [
                'status' => $response->status(),
                'model' => config('services.ai.model'),
                'body' => mb_substr(
                    $response->body(),
                    0,
                    2000
                ),
                'messages' => $this->debugMessages($messages),
            ]);

            $status = $response->status();

            throw new AiUnavailableException(
                match (true) {
                    in_array($status, [401, 403], true)
                        => "La clé du service d'IA est invalide ou non autorisée. Contactez un administrateur.",

                    $status === 429
                        => "L'assistant est très sollicité en ce moment. Réessayez dans une minute.",

                    $status === 529 || $status >= 500
                        => "Le service d'IA est momentanément indisponible. Réessayez dans un instant.",

                    default
                        => "L'assistant n'a pas pu répondre (erreur {$status}).",
                }
            );
        }

        $json = $response->json();

        if (!is_array($json)) {
            Log::error('AI: réponse API invalide', [
                'status' => $response->status(),
                'body' => mb_substr(
                    $response->body(),
                    0,
                    2000
                ),
            ]);

            throw new AiUnavailableException(
                "L'assistant a retourné une réponse invalide."
            );
        }

        return $json;
    }

    private function debugMessages(array $messages): array
    {
        $debug = [];

        foreach ($messages as $index => $message) {
            $entry = [
                'index' => $index,
                'role' => $message['role'] ?? null,
            ];

            $content = $message['content'] ?? null;

            if (is_string($content)) {
                $entry['content_type'] = 'string';
                $entry['content_preview'] = mb_substr(
                    $content,
                    0,
                    500
                );

                $debug[] = $entry;
                continue;
            }

            if (is_array($content)) {
                $entry['content_type'] = 'array';
                $entry['blocks'] = [];

                foreach ($content as $blockIndex => $block) {
                    if (!is_array($block)) {
                        $entry['blocks'][] = [
                            'index' => $blockIndex,
                            'type' => get_debug_type($block),
                        ];

                        continue;
                    }

                    $blockDebug = [
                        'index' => $blockIndex,
                        'type' => $block['type'] ?? null,
                    ];

                    if (($block['type'] ?? null) === 'tool_use') {
                        $input = $block['input'] ?? null;

                        $blockDebug['tool'] =
                            $block['name'] ?? null;

                        $blockDebug['tool_use_id'] =
                            $block['id'] ?? null;

                        $blockDebug['input_type'] =
                            get_debug_type($input);

                        $blockDebug['input'] =
                            $input;
                    }

                    if (($block['type'] ?? null) === 'tool_result') {
                        $blockDebug['tool_use_id'] =
                            $block['tool_use_id'] ?? null;

                        $blockDebug['content_preview'] =
                            is_string($block['content'] ?? null)
                                ? mb_substr(
                                    $block['content'],
                                    0,
                                    500
                                )
                                : ($block['content'] ?? null);
                    }

                    if (($block['type'] ?? null) === 'text') {
                        $blockDebug['text_preview'] =
                            mb_substr(
                                $block['text'] ?? '',
                                0,
                                500
                            );
                    }

                    $entry['blocks'][] = $blockDebug;
                }

                $debug[] = $entry;
                continue;
            }

            $entry['content_type'] =
                get_debug_type($content);

            $debug[] = $entry;
        }

        return $debug;
    }
}
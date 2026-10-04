<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $row = DB::table('ai_settings')->where('id', 1)->first(['provider_order']);
        if (!$row) {
            return;
        }

        $order = is_array($row->provider_order)
            ? $row->provider_order
            : json_decode((string) $row->provider_order, true);

        $knownDefaults = [
            ['anthropic', 'groq', 'openrouter', 'ollama'],
            ['openrouter', 'anthropic', 'groq', 'ollama'],
        ];

        // Update only untouched historical defaults; preserve an administrator's custom order.
        if (in_array($order, $knownDefaults, true)) {
            DB::table('ai_settings')->where('id', 1)->update([
                'provider_order' => json_encode(['openrouter', 'gemini', 'anthropic', 'openai', 'groq', 'ollama']),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Preserve provider ordering chosen by an administrator.
    }
};

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

        $oldDefaults = [
            ['anthropic', 'groq', 'openrouter', 'ollama'],
            ['openrouter', 'anthropic', 'groq', 'ollama'],
            ['openrouter', 'gemini', 'anthropic', 'openai', 'groq', 'ollama'],
        ];

        // Migrate only known application defaults; keep any order explicitly customized by an admin.
        if (in_array($order, $oldDefaults, true)) {
            DB::table('ai_settings')->where('id', 1)->update([
                'provider_order' => json_encode(['openrouter', 'gemini', 'anthropic', 'openai', 'groq', 'cloudflare', 'ollama']),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Keep admin-selected provider order unchanged on rollback.
    }
};

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

        // Only migrate the old untouched default; preserve any order an admin customized.
        if ($order === ['anthropic', 'groq', 'openrouter', 'ollama']) {
            DB::table('ai_settings')->where('id', 1)->update([
                'provider_order' => json_encode(['openrouter', 'anthropic', 'groq', 'ollama']),
                'updated_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        // Do not overwrite a provider order an administrator may have edited since deployment.
    }
};

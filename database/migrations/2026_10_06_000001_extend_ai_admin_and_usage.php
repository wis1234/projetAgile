<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('ai_settings', function (Blueprint $table) {
            $table->unsignedSmallInteger('max_steps')->default(8)->after('timeout');
            $table->unsignedSmallInteger('max_message_chars')->default(2000)->after('max_steps');
            $table->boolean('voice_enabled')->default(true)->after('max_message_chars');
            $table->unsignedInteger('voice_daily_limit')->default(50)->after('voice_enabled');
            $table->boolean('files_read_enabled')->default(true)->after('voice_daily_limit');
            $table->boolean('files_write_enabled')->default(true)->after('files_read_enabled');
            $table->boolean('members_manage_enabled')->default(true)->after('files_write_enabled');
            $table->boolean('reports_enabled')->default(true)->after('members_manage_enabled');
            $table->text('custom_instructions')->nullable()->after('reports_enabled');
            $table->unsignedSmallInteger('retention_days')->default(180)->after('custom_instructions');
        });

        Schema::table('ai_usages', function (Blueprint $table) {
            $table->unsignedBigInteger('conversation_id')->nullable()->after('user_id');
            $table->unsignedSmallInteger('steps')->default(0)->after('output_tokens');
            $table->unsignedSmallInteger('fallbacks')->default(0)->after('steps');
            $table->boolean('via_voice')->default(false)->after('fallbacks');
            $table->json('attempts')->nullable()->after('via_voice');   // [{provider, ok, code, ms}]
            $table->json('tools')->nullable()->after('attempts');        // {"list_tasks":2,"create_task":1}
        });
    }

    public function down(): void
    {
        Schema::table('ai_usages', function (Blueprint $table) {
            $table->dropColumn(['conversation_id', 'steps', 'fallbacks', 'via_voice', 'attempts', 'tools']);
        });
        Schema::table('ai_settings', function (Blueprint $table) {
            $table->dropColumn(['max_steps', 'max_message_chars', 'voice_enabled', 'voice_daily_limit', 'files_read_enabled',
                'files_write_enabled', 'members_manage_enabled', 'reports_enabled', 'custom_instructions', 'retention_days']);
        });
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('private_inbox_messages', function (Blueprint $table) {
            // text | image | audio | video | sticker
            $table->string('type', 16)->default('text')->after('conversation_id');
            // Chemin relatif (disque « public »), même convention que task_comments
            $table->string('attachment_path')->nullable()->after('tag');
            // Pour les stickers : « image » ou « video »
            $table->string('attachment_kind', 8)->nullable()->after('attachment_path');
            $table->foreignId('reply_to_id')->nullable()->after('attachment_kind')
                ->constrained('private_inbox_messages')->nullOnDelete();

            // Liste des conversations / non-lus : requêtes fréquentes
            $table->index(['receiver_id', 'read_at']);
            $table->index(['conversation_id', 'id']);
        });
    }

    public function down(): void
    {
        Schema::table('private_inbox_messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('reply_to_id');
            $table->dropIndex(['receiver_id', 'read_at']);
            $table->dropIndex(['conversation_id', 'id']);
            $table->dropColumn(['type', 'attachment_path', 'attachment_kind']);
        });
    }
};

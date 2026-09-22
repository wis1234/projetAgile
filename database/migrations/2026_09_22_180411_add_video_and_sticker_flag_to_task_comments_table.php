<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('task_comments', function (Blueprint $table) {
            // Jusqu'ici seuls audio_path et image_path existaient : aucun champ pour une vidéo.
            $table->string('video_path')->nullable()->after('image_path');
            // Permet au front de savoir qu'il s'agit d'un sticker (rendu différent d'une photo/vidéo normale)
            $table->boolean('is_sticker')->default(false)->after('video_path');
        });
    }

    public function down(): void
    {
        Schema::table('task_comments', function (Blueprint $table) {
            $table->dropColumn(['video_path', 'is_sticker']);
        });
    }
};
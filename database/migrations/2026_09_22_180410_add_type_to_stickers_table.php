<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stickers', function (Blueprint $table) {
            // 'image' (png/jpg/gif/webp) ou 'video' (mp4/webm/mov) pour les stickers "vidéo dansante"
            $table->string('type')->default('image')->after('image_path');
        });
    }

    public function down(): void
    {
        Schema::table('stickers', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
};
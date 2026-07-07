<?php
// ─────────────────────────────────────────────────────────────
// 1. php artisan make:migration create_file_versions_table
// ─────────────────────────────────────────────────────────────
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // ── Versions (snapshot à chaque save) ────────────────
        Schema::create('file_versions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('file_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->longText('content');           // HTML snapshot
            $table->string('label')->nullable();   // "v1.2 – Relecture finale"
            $table->string('summary')->nullable(); // "Ajout intro, correction §3"
            $table->integer('version_number');     // 1, 2, 3 …
            $table->timestamps();

            $table->index(['file_id', 'version_number']);
        });

       
    }

    public function down(): void
    {
        Schema::dropIfExists('file_versions');
    }
};

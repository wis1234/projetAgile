<?php
// ─────────────────────────────────────────────────────────────
// 1. php artisan make:migration create_file_access_table
// ─────────────────────────────────────────────────────────────
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {

        // ── Permissions d'accès par utilisateur ──────────────
        Schema::create('file_accesses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('file_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            // none | view | comment | edit | admin
            $table->enum('permission', ['none', 'view', 'comment', 'edit', 'admin'])
                  ->default('view');
            $table->foreignId('granted_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->unique(['file_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('file_accesses');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('quiz_cumuls', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained('projects')->cascadeOnDelete();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('missing_policy', 10)->default('zero'); // zero | ignore
            $table->boolean('include_bonus')->default(true);
            $table->timestamps();
        });

        Schema::create('quiz_cumul_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_cumul_id')->constrained('quiz_cumuls')->cascadeOnDelete();
            $table->foreignId('quiz_id')->constrained('quizzes')->cascadeOnDelete();
            $table->decimal('coefficient', 5, 2)->default(1);
            $table->timestamps();

            $table->unique(['quiz_cumul_id', 'quiz_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('quiz_cumul_items');
        Schema::dropIfExists('quiz_cumuls');
    }
};

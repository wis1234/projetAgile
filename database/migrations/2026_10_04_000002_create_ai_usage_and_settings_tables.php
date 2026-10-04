<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ai_settings', function (Blueprint $table) {
            $table->id();
            $table->boolean('enabled')->default(true);
            $table->unsignedInteger('daily_limit')->default(100);
            $table->unsignedInteger('max_tokens')->default(1800);
            $table->unsignedSmallInteger('timeout')->default(90);
            $table->json('provider_order')->nullable();
            $table->timestamps();
        });

        Schema::create('ai_user_settings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('daily_limit')->nullable();
            $table->boolean('enabled')->default(true);
            $table->timestamps();
        });

        Schema::create('ai_usages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('kind', 24)->default('chat');
            $table->string('provider', 32)->nullable();
            $table->string('model', 120)->nullable();
            $table->string('status', 16)->default('started');
            $table->unsignedInteger('duration_ms')->nullable();
            $table->unsignedInteger('input_tokens')->nullable();
            $table->unsignedInteger('output_tokens')->nullable();
            $table->string('failure_reason', 500)->nullable();
            $table->timestamps();
            $table->index(['user_id', 'created_at']);
            $table->index(['kind', 'created_at']);
            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_usages');
        Schema::dropIfExists('ai_user_settings');
        Schema::dropIfExists('ai_settings');
    }
};

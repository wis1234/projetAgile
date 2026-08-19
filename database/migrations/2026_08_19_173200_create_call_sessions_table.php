<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('call_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->foreignId('initiator_id')->constrained('users')->onDelete('cascade');
            $table->string('room_name');
            $table->string('invite_token', 64)->unique();
            $table->string('invite_code', 8)->unique();
            $table->enum('status', ['active', 'ended'])->default('active');
            $table->timestamp('started_at')->useCurrent();
            $table->timestamp('ended_at')->nullable();
            $table->timestamps();

            $table->index(['project_id', 'status']);
            $table->index('invite_token');
            $table->index('invite_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('call_sessions');
    }
};

<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('zoom_meetings', function (Blueprint $table) {
            $table->id();
            $table->foreignId('project_id')->constrained()->onDelete('cascade');
            $table->string('meeting_id')->unique();
            $table->string('host_id');
            $table->string('topic');
            $table->text('agenda')->nullable();
            $table->dateTime('start_time');
            $table->integer('duration');
            $table->string('timezone');
            $table->string('password');
            $table->string('start_url');
            $table->string('join_url');
            $table->string('status')->default('waiting');
            $table->json('settings')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('zoom_meetings');
    }
};

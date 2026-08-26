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
        Schema::table('tasks', function (Blueprint $table) {
            $table->timestamp('submitted_at')->nullable();
            $table->unsignedBigInteger('deliverable_id')->nullable();
            $table->unsignedBigInteger('validator_id')->nullable();
            
            // Assuming files and users tables exist
            // $table->foreign('deliverable_id')->references('id')->on('files')->onDelete('set null');
            // $table->foreign('validator_id')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['submitted_at', 'deliverable_id', 'validator_id']);
        });
    }
};

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
        Schema::create('schools', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique()->nullable();
            $table->enum('type', ['public', 'private', 'community', 'international'])->default('public');
            $table->enum('status', ['active', 'inactive', 'pending'])->default('active');
            $table->text('description')->nullable();
            $table->string('address');
            $table->string('postal_code', 20)->nullable();
            $table->string('city');
            $table->string('country')->default('Guinée');
            $table->string('email')->unique();
            $table->string('phone');
            $table->string('website')->nullable();
            $table->string('principal_name')->nullable();
            $table->integer('capacity')->nullable()->comment('Capacité d\'accueil en nombre d\'étudiants');
            
            // Clés étrangères
            $table->foreignId('created_by')->nullable()->constrained('users')->onDelete('set null');
            $table->foreignId('updated_by')->nullable()->constrained('users')->onDelete('set null');
            
            $table->timestamps();
            $table->softDeletes();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schools');
    }
};

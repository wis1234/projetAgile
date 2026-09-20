<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Candidats inscrits à un quiz : des utilisateurs ProJA qui n'ont pas besoin d'être membres du projet.
        Schema::create('quiz_candidates', function (Blueprint $table) {
            $table->id();
            $table->foreignId('quiz_id')->constrained('quizzes')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('added_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['quiz_id', 'user_id']);
            $table->index('user_id');
        });

        // Quiz « fermé » : seuls les candidats ajoutés (et les responsables) y ont accès.
        Schema::table('quizzes', function (Blueprint $table) {
            $table->boolean('restricted_to_candidates')->default(false);
        });
    }

    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn('restricted_to_candidates');
        });

        Schema::dropIfExists('quiz_candidates');
    }
};

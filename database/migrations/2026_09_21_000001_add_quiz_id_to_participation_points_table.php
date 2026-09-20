<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Le bonus est désormais attribué dans le cadre d'un quiz, à ses membres (candidats inscrits).
        // quiz_id NULL = ancien bonus « général » du projet : il continue de compter pour tous les quiz
        // du projet, afin de ne pas modifier les résultats déjà établis.
        Schema::table('participation_points', function (Blueprint $table) {
            $table->foreignId('quiz_id')->nullable()->after('project_id')->constrained('quizzes')->cascadeOnDelete();
            $table->index(['quiz_id', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('participation_points', function (Blueprint $table) {
            $table->dropForeign(['quiz_id']);
            $table->dropIndex(['quiz_id', 'user_id']);
            $table->dropColumn('quiz_id');
        });
    }
};

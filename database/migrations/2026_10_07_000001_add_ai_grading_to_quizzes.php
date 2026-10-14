<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quiz_responses', function (Blueprint $table) {
            // Traçabilité : une note posée par l'IA est signalée au correcteur humain (qui reste libre de la modifier)
            $table->boolean('ai_graded')->default(false)->after('graded_by');
            $table->unsignedTinyInteger('ai_confidence')->nullable()->after('ai_graded');   // 0-100
            $table->text('ai_note')->nullable()->after('ai_confidence');                     // remarque interne, jamais montrée au candidat
            $table->string('ai_model', 80)->nullable()->after('ai_note');
        });

        Schema::table('quiz_questions', function (Blueprint $table) {
            // Éléments de correction attendus (générés une fois puis réutilisés pour TOUTES les copies : notation homogène)
            $table->text('ai_rubric')->nullable()->after('correct_answer');
        });

        Schema::table('ai_settings', function (Blueprint $table) {
            $table->boolean('quiz_grading_enabled')->default(true)->after('reports_enabled');
            $table->unsignedInteger('quiz_grading_daily_limit')->default(300)->after('quiz_grading_enabled'); // copies / jour / utilisateur
        });
    }

    public function down(): void
    {
        Schema::table('ai_settings', fn (Blueprint $t) => $t->dropColumn(['quiz_grading_enabled', 'quiz_grading_daily_limit']));
        Schema::table('quiz_questions', fn (Blueprint $t) => $t->dropColumn('ai_rubric'));
        Schema::table('quiz_responses', fn (Blueprint $t) => $t->dropColumn(['ai_graded', 'ai_confidence', 'ai_note', 'ai_model']));
    }
};

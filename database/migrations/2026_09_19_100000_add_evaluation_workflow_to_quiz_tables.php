<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Workflow d'évaluation : brouillons, correction collaborative (verrou de copie),
 * état "en attente" des résultats et délibération.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->boolean('is_draft')->default(false)->after('is_active');
            $table->string('deliberation_status', 20)->default('none')->after('allow_public_access'); // none | open | validated
            $table->timestamp('deliberation_opened_at')->nullable()->after('deliberation_status');
            $table->timestamp('validated_at')->nullable()->after('deliberation_opened_at');
            $table->string('validated_fingerprint', 40)->nullable()->after('validated_at');
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->foreignId('grading_locked_by')->nullable()->after('completed_at')->constrained('users')->nullOnDelete();
            $table->timestamp('grading_locked_at')->nullable()->after('grading_locked_by');
            $table->timestamp('graded_at')->nullable()->after('grading_locked_at');
        });

        Schema::table('quiz_results', function (Blueprint $table) {
            $table->string('grading_status', 20)->default('graded')->after('total_questions')->index(); // graded | pending
            $table->decimal('score_exact', 6, 2)->nullable()->after('score');
        });

        // Rétro-compatibilité : les résultats existants ayant des copies non corrigées passent « en attente »
        DB::table('quiz_results')
            ->whereIn('attempt_id', function ($query) {
                $query->select('attempt_id')
                    ->from('quiz_responses')
                    ->where('grading_status', 'pending');
            })
            ->update(['grading_status' => 'pending']);

        DB::table('quiz_results')->update(['score_exact' => DB::raw('score')]);
    }

    public function down(): void
    {
        Schema::table('quiz_results', function (Blueprint $table) {
            $table->dropColumn(['grading_status', 'score_exact']);
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropConstrainedForeignId('grading_locked_by');
            $table->dropColumn(['grading_locked_at', 'graded_at']);
        });

        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn([
                'is_draft',
                'deliberation_status',
                'deliberation_opened_at',
                'validated_at',
                'validated_fingerprint',
            ]);
        });
    }
};

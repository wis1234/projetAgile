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
        Schema::table('quizzes', function (Blueprint $table) {
            $table->string('public_token', 64)->nullable()->unique()->after('show_results');
            $table->boolean('allow_public_access')->default(false)->after('public_token');
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->string('guest_name')->nullable()->after('user_id');
            $table->string('guest_email')->nullable()->after('guest_name');
        });

        Schema::table('quiz_results', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->string('guest_name')->nullable()->after('user_id');
            $table->string('guest_email')->nullable()->after('guest_name');
        });

        Schema::table('quiz_responses', function (Blueprint $table) {
            $table->foreignId('user_id')->nullable()->change();
            $table->string('guest_name')->nullable()->after('user_id');
            $table->string('guest_email')->nullable()->after('guest_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('quizzes', function (Blueprint $table) {
            $table->dropColumn(['public_token', 'allow_public_access']);
        });

        Schema::table('quiz_attempts', function (Blueprint $table) {
            $table->dropColumn(['guest_name', 'guest_email']);
        });

        Schema::table('quiz_results', function (Blueprint $table) {
            $table->dropColumn(['guest_name', 'guest_email']);
        });

        Schema::table('quiz_responses', function (Blueprint $table) {
            $table->dropColumn(['guest_name', 'guest_email']);
        });
    }
};

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
        Schema::table('files', function (Blueprint $table) {
            if (!Schema::hasColumn('files', 'share_token')) {
                $table->string('share_token', 64)->nullable()->unique()->after('password_hash');
            }
            if (!Schema::hasColumn('files', 'public_permission')) {
                $table->string('public_permission', 20)->default('none')->after('share_token');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('files', function (Blueprint $table) {
            if (Schema::hasColumn('files', 'share_token')) {
                $table->dropColumn('share_token');
            }
            if (Schema::hasColumn('files', 'public_permission')) {
                $table->dropColumn('public_permission');
            }
        });
    }
};

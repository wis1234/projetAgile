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
        if (!Schema::hasColumn('files', 'share_token')) {
            Schema::table('files', function (Blueprint $table) {
                $table->string('share_token', 64)->nullable()->unique();
            });
        }

        if (!Schema::hasColumn('files', 'public_permission')) {
            Schema::table('files', function (Blueprint $table) {
                $table->string('public_permission', 20)->default('none');
            });
        }
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

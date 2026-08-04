<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->foreignId('locked_by')
                  ->nullable()
                  ->after('is_password_protected')
                  ->constrained('users')
                  ->nullOnDelete();

            // Snapshot du rôle au moment du verrouillage (admin | manager)
            // pour que le comportement ne bouge pas si le rôle change ensuite
            $table->string('locked_by_role')->nullable()->after('locked_by');
        });
    }

    public function down(): void
    {
        Schema::table('files', function (Blueprint $table) {
            $table->dropConstrainedForeignId('locked_by');
            $table->dropColumn('locked_by_role');
        });
    }
};
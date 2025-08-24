<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('project_user', function (Blueprint $table) {
            if (!Schema::hasColumn('project_user', 'is_muted')) {
                $table->boolean('is_muted')->default(false)->after('role');
            }
        });
    }

    public function down()
    {
        Schema::table('project_user', function (Blueprint $table) {
            if (Schema::hasColumn('project_user', 'is_muted')) {
                $table->dropColumn('is_muted');
            }
        });
    }
};

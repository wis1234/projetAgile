<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        // Vérifier si la colonne existe déjà
        if (!Schema::hasColumn('project_user', 'is_muted')) {
            Schema::table('project_user', function (Blueprint $table) {
                $table->boolean('is_muted')->default(false)->after('role');
            });
            
            // Mettre à jour les valeurs existantes
            \DB::table('project_user')->update(['is_muted' => false]);
        }
    }

    public function down()
    {
        if (Schema::hasColumn('project_user', 'is_muted')) {
            Schema::table('project_user', function (Blueprint $table) {
                $table->dropColumn('is_muted');
            });
        }
    }
};

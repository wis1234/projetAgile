<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Mettre à jour les valeurs existantes
        DB::table('schools')->where('type', 'public')->update(['type' => 'primary']);
        DB::table('schools')->where('type', 'private')->update(['type' => 'high']);
        DB::table('schools')->where('type', 'community')->update(['type' => 'middle']);
        DB::table('schools')->where('type', 'international')->update(['type' => 'university']);
        
        // Modifier la colonne type
        DB::statement("ALTER TABLE schools MODIFY COLUMN type ENUM('primary', 'middle', 'high', 'university', 'other') NOT NULL DEFAULT 'primary'");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Revenir aux anciennes valeurs
        DB::table('schools')->where('type', 'primary')->update(['type' => 'public']);
        DB::table('schools')->where('type', 'middle')->update(['type' => 'community']);
        DB::table('schools')->where('type', 'high')->update(['type' => 'private']);
        DB::table('schools')->where('type', 'university')->update(['type' => 'international']);
        
        // Revenir à l'ancien enum
        DB::statement("ALTER TABLE schools MODIFY COLUMN type ENUM('public', 'private', 'community', 'international') NOT NULL DEFAULT 'public'");
    }
};

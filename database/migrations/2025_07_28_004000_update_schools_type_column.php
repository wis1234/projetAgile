<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use App\Models\School;

return new class extends Migration
{
    /**
     * Exécuter les migrations.
     */
    public function up(): void
    {
        // Mettre à jour les valeurs existantes vers les nouvelles valeurs
        // On convertit les anciennes valeurs vers les nouvelles
        $mapping = [
            'public' => School::TYPE_PRIMARY,
            'private' => School::TYPE_HIGH,
            'community' => School::TYPE_OTHER,
            'international' => School::TYPE_UNIVERSITY,
        ];

        // Mettre à jour les enregistrements existants
        foreach ($mapping as $oldValue => $newValue) {
            \DB::table('schools')
                ->where('type', $oldValue)
                ->update(['type' => $newValue]);
        }

        // Modifier la colonne pour utiliser les nouvelles valeurs
        Schema::table('schools', function (Blueprint $table) {
            $table->enum('type', [
                School::TYPE_PRIMARY,
                School::TYPE_MIDDLE,
                School::TYPE_HIGH,
                School::TYPE_UNIVERSITY,
                School::TYPE_OTHER,
            ])->default(School::TYPE_OTHER)->change();
        });
    }

    /**
     * Annuler les migrations.
     */
    public function down(): void
    {
        // Mapping inverse pour le rollback
        $reverseMapping = [
            School::TYPE_PRIMARY => 'public',
            School::TYPE_MIDDLE => 'private',
            School::TYPE_HIGH => 'private',
            School::TYPE_UNIVERSITY => 'international',
            School::TYPE_OTHER => 'community',
        ];

        // Mettre à jour les enregistrements vers les anciennes valeurs
        foreach ($reverseMapping as $newValue => $oldValue) {
            \DB::table('schools')
                ->where('type', $newValue)
                ->update(['type' => $oldValue]);
        }

        // Revenir à l'ancien enum
        Schema::table('schools', function (Blueprint $table) {
            $table->enum('type', ['public', 'private', 'community', 'international'])
                  ->default('public')
                  ->change();
        });
    }
};

<?php

namespace Database\Seeders;

use App\Models\School;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SchoolSeeder extends Seeder
{
    /**
     * Exécute le seeder.
     */
    public function run(): void
    {
        // Création d'un administrateur système s'il n'existe pas
        $admin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'name' => 'Administrateur Système',
                'password' => Hash::make('password'),
                'role' => 'admin',
                'email_verified_at' => now(),
            ]
        );

        // Création d'écoles de démonstration
        $schools = [
            [
                'name' => 'Lycée Sainte Marie',
                'code' => 'LSM-2025',
                'type' => 'private',
                'status' => 'active',
                'description' => 'Établissement privé d\'excellence',
                'address' => '123 Avenue de la République',
                'postal_code' => '00100',
                'city' => 'Conakry',
                'country' => 'Guinée',
                'email' => 'contact@lyceesaintemarie.gn',
                'phone' => '622 00 00 00',
                'website' => 'https://lyceesaintemarie.gn',
                'principal_name' => 'M. Diallo',
                'capacity' => 1200,
                'created_by' => $admin->id,
                'updated_by' => $admin->id,
            ],
            [
                'name' => 'Groupe Scolaire Les Lauréats',
                'code' => 'GSL-2025',
                'type' => 'private',
                'status' => 'active',
                'description' => 'Établissement privé avec internat',
                'address' => '456 Boulevard du Commerce',
                'postal_code' => '00100',
                'city' => 'Conakry',
                'country' => 'Guinée',
                'email' => 'info@leslaureats.gn',
                'phone' => '623 00 00 00',
                'website' => 'https://leslaureats.gn',
                'principal_name' => 'Mme Camara',
                'capacity' => 1500,
                'created_by' => $admin->id,
                'updated_by' => $admin->id,
            ],
            [
                'name' => 'Lycée Technique de Ratoma',
                'code' => 'LTR-2025',
                'type' => 'public',
                'status' => 'active',
                'description' => 'Établissement public technique',
                'address' => '789 Rue KA 003',
                'postal_code' => '00100',
                'city' => 'Conakry',
                'country' => 'Guinée',
                'email' => 'contact@lyceetechniqueratoma.gn',
                'phone' => '624 00 00 00',
                'website' => null,
                'principal_name' => 'M. Soumah',
                'capacity' => 2000,
                'created_by' => $admin->id,
                'updated_by' => $admin->id,
            ],
            [
                'name' => 'École Internationale de Guinée',
                'code' => 'EIG-2025',
                'type' => 'international',
                'status' => 'active',
                'description' => 'Établissement international avec programme bilingue',
                'address' => 'Route du Niger',
                'postal_code' => '00224',
                'city' => 'Conakry',
                'country' => 'Guinée',
                'email' => 'contact@eiguinee.org',
                'phone' => '625 00 00 00',
                'website' => 'https://www.eiguinee.org',
                'principal_name' => 'M. Johnson',
                'capacity' => 800,
                'created_by' => $admin->id,
                'updated_by' => $admin->id,
            ],
            [
                'name' => 'Complexe Scolaire La Colombe',
                'code' => 'CSC-2025',
                'type' => 'private',
                'status' => 'pending',
                'description' => 'Nouvel établissement en cours d\'ouverture',
                'address' => 'Rue KA 178',
                'postal_code' => '00100',
                'city' => 'Conakry',
                'country' => 'Guinée',
                'email' => 'info@lacolombe.gn',
                'phone' => '626 00 00 00',
                'website' => 'https://lacolombe.gn',
                'principal_name' => 'Mme Diallo',
                'capacity' => 1000,
                'created_by' => $admin->id,
                'updated_by' => $admin->id,
            ],
        ];

        foreach ($schools as $schoolData) {
            School::firstOrCreate(
                ['email' => $schoolData['email']],
                $schoolData
            );
        }

        // Création d'un administrateur d'école pour le premier établissement
        $firstSchool = School::first();
        if ($firstSchool) {
            $schoolAdmin = User::firstOrCreate(
                ['email' => 'admin@lyceesaintemarie.gn'],
                [
                    'name' => 'Admin Lycée Sainte Marie',
                    'password' => Hash::make('password'),
                    'role' => 'school_admin',
                    'school_id' => $firstSchool->id,
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}

<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Project;
use App\Models\Sprint;
use App\Models\Task;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Appel des seeders nécessaires
        $this->call([
            RoleSeeder::class,
            SchoolSeeder::class,
            SubscriptionPlansTableSeeder::class,
            SubscriptionsTableSeeder::class,
        ]);
        
        // Création d'un admin par défaut si nécessaire
        if (!User::where('email', 'admin@proja.com')->exists()) {
            $admin = User::create([
                'name' => 'Administrateur',
                'email' => 'admin@proja.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'admin',
            ]);
            
            $admin->assignRole('admin');
        }
        
        // Création d'utilisateurs de test si en environnement local
        if (app()->environment('local')) {
            // Création d'un utilisateur test
            User::create([
                'name' => 'Utilisateur Test',
                'email' => 'test@proja.com',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'role' => 'user',
            ]);
            
            // Création d'utilisateurs aléatoires
            $users = User::factory(10)->create();
            
            // Création de projets
            $projects = Project::factory(5)->create();
            
            // Création de sprints et tâches pour chaque projet
            $projects->each(function ($project) use ($users) {
                $sprints = Sprint::factory(2)->create([
                    'project_id' => $project->id,
                ]);
                
                // Tâches pour chaque sprint
                $sprints->each(function ($sprint) use ($project, $users) {
                    Task::factory(5)->create([
                        'project_id' => $project->id,
                        'sprint_id' => $sprint->id,
                        'assigned_to' => $users->random()->id,
                    ]);
                });
            });
        }
    }
}

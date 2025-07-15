<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call(RoleSeeder::class);

        \App\Models\User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
            'role' => 'admin',
        ]);
        // Utilisateurs
        \App\Models\User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
            'role' => 'user',
        ]);
        $users = \App\Models\User::factory(10)->create();

        // Projets
        $projects = \App\Models\Project::factory(5)->create();

        // Sprints (kanbans)
        $projects->each(function ($project) {
            $sprints = \App\Models\Sprint::factory(2)->create([
                'project_id' => $project->id,
            ]);
            // Tâches pour chaque sprint
            $sprints->each(function ($sprint) use ($project) {
                $tasks = \App\Models\Task::factory(5)->create([
                    'project_id' => $project->id,
                    'sprint_id' => $sprint->id,
                    'assigned_to' => \App\Models\User::inRandomOrder()->first()->id,
                ]);
            });
        });
    }
}

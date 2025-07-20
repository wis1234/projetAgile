<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;

class RoleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $roles = [
            'admin', 'user', 'manager', 'student', 'teacher', 'parent', 'school_admin', 'class_rep'
        ];
        foreach ($roles as $role) {
            Role::firstOrCreate(['name' => $role]);
        }
    }
}
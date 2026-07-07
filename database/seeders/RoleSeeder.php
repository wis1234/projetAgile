<?php
namespace Database\Seeders;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            // Users
            'view users', 'create users', 'edit users', 'delete users',
            // Projects
            'view projects', 'create projects', 'edit projects', 'delete projects',
            // Tasks
            'view tasks', 'create tasks', 'edit tasks', 'delete tasks',
            // Task comments
            'view task_comments', 'create task_comments', 'edit task_comments', 'delete task_comments',
            // Task payments
            'view task_payments', 'create task_payments', 'edit task_payments', 'delete task_payments',
            // Sprints
            'view sprints', 'create sprints', 'edit sprints', 'delete sprints',
            // Files
            'view files', 'create files', 'edit files', 'delete files',
            // File comments
            'view file_comments', 'create file_comments', 'delete file_comments',
            // Messages
            'view messages', 'create messages', 'delete messages',
            // Notifications
            'view notifications',
            // Recruitments
            'view recruitments', 'create recruitments', 'edit recruitments', 'delete recruitments',
            'view recruitment_applications', 'edit recruitment_applications', 'delete recruitment_applications',
            // Remunerations
            'view remunerations', 'create remunerations', 'edit remunerations', 'delete remunerations',
            // Subscriptions
            'view subscriptions', 'create subscriptions', 'edit subscriptions', 'delete subscriptions',
            'view subscription_plans', 'create subscription_plans', 'edit subscription_plans', 'delete subscription_plans',
            // Schools
            'view schools', 'create schools', 'edit schools', 'delete schools',
            // Zoom meetings
            'view zoom_meetings', 'create zoom_meetings', 'edit zoom_meetings', 'delete zoom_meetings',
            // Audit logs & activities
            'view audit_logs', 'view activities',
            // Roles & permissions
            'manage roles', 'manage permissions',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $adminRole   = Role::firstOrCreate(['name' => 'admin']);
        $managerRole = Role::firstOrCreate(['name' => 'manager']);
        $userRole    = Role::firstOrCreate(['name' => 'user']);
        $memberRole  = Role::firstOrCreate(['name' => 'member']);

        // Admin a toutes les permissions
        $adminRole->syncPermissions(Permission::all());

        // Manager
        $managerRole->syncPermissions([
            'view users', 'edit users',
            'view projects', 'create projects', 'edit projects',
            'view tasks', 'create tasks', 'edit tasks', 'delete tasks',
            'view task_comments', 'create task_comments', 'delete task_comments',
            'view sprints', 'create sprints', 'edit sprints',
            'view files', 'create files', 'delete files',
            'view file_comments', 'create file_comments',
            'view messages', 'create messages',
            'view notifications',
            'view recruitments', 'create recruitments', 'edit recruitments',
            'view recruitment_applications', 'edit recruitment_applications',
            'view remunerations', 'create remunerations', 'edit remunerations',
            'view zoom_meetings', 'create zoom_meetings', 'edit zoom_meetings',
            'view subscriptions', 'view subscription_plans',
        ]);

        // User
        $userRole->syncPermissions([
            'view projects',
            'view tasks', 'create tasks', 'edit tasks',
            'view task_comments', 'create task_comments',
            'view sprints',
            'view files', 'create files',
            'view file_comments', 'create file_comments',
            'view messages', 'create messages',
            'view notifications',
            'view zoom_meetings',
        ]);

        // Member (lecture seule principalement)
        $memberRole->syncPermissions([
            'view projects',
            'view tasks',
            'view task_comments', 'create task_comments',
            'view sprints',
            'view files',
            'view file_comments',
            'view messages', 'create messages',
            'view notifications',
            'view zoom_meetings',
        ]);
    }
}
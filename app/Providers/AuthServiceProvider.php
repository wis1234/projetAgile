<?php

namespace App\Providers;

use Illuminate\Support\Facades\Gate;
use App\Models\Project;
use App\Policies\ProjectPolicy;
use App\Models\Task;
use App\Policies\TaskPolicy;
use App\Models\Sprint;
use App\Policies\SprintPolicy;
use App\Models\User;
use App\Policies\UserPolicy;
use App\Models\School;
use App\Policies\SchoolPolicy;
use App\Models\File;
use App\Policies\FilePolicy;

class AuthServiceProvider extends \Illuminate\Auth\AuthServiceProvider
{
    /**
     * The application's policies.
     *
     * @var array
     */
    protected $policies = [
        Project::class => ProjectPolicy::class,
        Task::class => TaskPolicy::class,
        Sprint::class => SprintPolicy::class,
        User::class => UserPolicy::class,
        School::class => SchoolPolicy::class,
        File::class => FilePolicy::class,
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        Gate::define('admin-only', function ($user) {
            return $user->email === 'ronaldoagbohou@gmail.com';
        });

        // Définition des capacités spécifiques pour les écoles
        Gate::define('manage-school-hosts', function (User $user, School $school) {
            return $user->can('manageHosts', $school);
        });
    }
}
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
    }
}
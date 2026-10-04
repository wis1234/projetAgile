<?php

namespace App\Providers;

use App\Models\TaskComment;
use App\Observers\TaskCommentObserver;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        TaskComment::observe(TaskCommentObserver::class);

        // Filet de sécurité : la Gate admin-only existe toujours (AuthServiceProvider peut la redéfinir).
        if (!Gate::has('admin-only')) {
            Gate::define('admin-only', fn ($user) => $user && $user->hasAdminAccess());
        }
    }
}

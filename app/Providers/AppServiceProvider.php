<?php

namespace App\Providers;

use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use App\Models\Activity;
use Illuminate\Support\Facades\Auth;

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

        if (!function_exists('activity_log')) {
            function activity_log($type, $description = null, $subject = null) {
                Activity::create([
                    'user_id' => Auth::id(),
                    'type' => $type,
                    'description' => $description,
                    'subject_type' => $subject ? get_class($subject) : null,
                    'subject_id' => $subject ? $subject->id : null,
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);
            }
        }
    }
}

<?php

use App\Models\Activity;
use App\Services\ActivityLogger;
use Illuminate\Database\Eloquent\Model;

if (!function_exists('activity_log')) {
    /**
     * @param  Model|null  $subject
     */
    function activity_log(string $type, ?string $description = null, $subject = null, ?int $userId = null): Activity
    {
        $model = $subject instanceof Model ? $subject : null;

        return ActivityLogger::log($type, $description, $model, $userId);
    }
}

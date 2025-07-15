<?php

use App\Models\Activity;
use Illuminate\Support\Facades\Auth;

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
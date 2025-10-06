<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Zoom API Configuration
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for Zoom API.
    |
    */

    'client_id' => env('ZOOM_CLIENT_ID'),
    'client_secret' => env('ZOOM_CLIENT_SECRET'),
    'account_id' => env('ZOOM_ACCOUNT_ID'),
    'default_user_id' => env('ZOOM_DEFAULT_USER_ID'),
    'sdk_key' => env('ZOOM_SDK_KEY'),
    'sdk_secret' => env('ZOOM_SDK_SECRET'),
    'base_url' => env('ZOOM_BASE_URL', 'https://api.zoom.us/v2'),
    'token_lifetime' => env('ZOOM_TOKEN_LIFETIME', 60 * 60), // 1 hour in seconds
    'meeting_settings' => [
        'host_video' => true,
        'participant_video' => true,
        'join_before_host' => false,
        'mute_upon_entry' => true,
        'waiting_room' => true,
        'approval_type' => 1, // Manually approve participants
        'auto_recording' => 'cloud',
    ],
];

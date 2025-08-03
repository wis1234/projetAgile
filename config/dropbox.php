<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Dropbox Configuration
    |--------------------------------------------------------------------------
    |
    | Configuration pour l'intégration avec l'API Dropbox.
    |
    */

    'client_id' => env('DROPBOX_CLIENT_ID'),
    'client_secret' => env('DROPBOX_CLIENT_SECRET'),
    'refresh_token' => env('DROPBOX_REFRESH_TOKEN'),
    'access_token' => env('DROPBOX_ACCESS_TOKEN'),
    'app_key' => env('DROPBOX_APP_KEY'),
    'app_secret' => env('DROPBOX_APP_SECRET'),
    'authorization_token' => env('DROPBOX_AUTHORIZATION_TOKEN'),
];

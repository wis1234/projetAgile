<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Route Filter
    |--------------------------------------------------------------------------
    |
    | Filters are used to filter routes that should be included in the Ziggy
    | generated routes file. You can include or exclude routes by using the
    | include or exclude arrays. You can also filter routes by their domains.
    |
    */

    'include' => [
        'api/*',
        'api/projects/*',
    ],

    'exclude' => [
        'debugbar.*',
        'ignition.*',
        'telescope*',
        'horizon*',
        'vendor/*',
    ],

    /*
    |--------------------------------------------------------------------------
    | Route Groups
    |--------------------------------------------------------------------------
    |
    | You can group routes by their name prefix, which can be useful for
    | organizing your routes in the generated JavaScript file.
    |
    */

    'groups' => [
        'admin' => ['admin.*'],
        'api' => ['api.*'],
    ],

    /*
    |--------------------------------------------------------------------------
    | Route Name Aliases
    |--------------------------------------------------------------------------
    |
    | You can define aliases for your route names here. This can be useful
    | if you want to use different route names in your JavaScript code.
    |
    */

    'aliases' => [
        // 'users.index' => 'admin.users.index',
    ],

    /*
    |--------------------------------------------------------------------------
    | URL Generation
    |--------------------------------------------------------------------------
    |
    | These options control how Ziggy generates URLs. You can choose to
    | generate absolute or relative URLs, and whether to include the port
    | in the URL.
    |
    */

    'url' => env('APP_URL'),
    'absolute' => true,
    'port' => env('APP_PORT', 80),
];

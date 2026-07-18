<?php

return [
    /*
    |--------------------------------------------------------------------------
    | VAPID Keys (Voluntary Application Server Identification)
    |--------------------------------------------------------------------------
    |
    | Ces clés permettent d'authentifier votre serveur auprès des services
    | de push (Google FCM, Mozilla, Apple, etc.).
    |
    | Générez-les une seule fois avec la commande :
    |   php artisan webpush:vapid
    |
    | Puis copiez les valeurs dans votre fichier .env
    |
    */
    'vapid' => [
        'subject'     => env('VAPID_SUBJECT', env('APP_URL')),
        'public_key'  => env('VAPID_PUBLIC_KEY', ''),
        'private_key' => env('VAPID_PRIVATE_KEY', ''),
    ],
];

<?php

return [
    /*
    |--------------------------------------------------------------------------
    | reCAPTCHA v3
    |--------------------------------------------------------------------------
    |
    | Clés reCAPTCHA v3. Obtenez vos clés sur https://www.google.com/recaptcha/admin
    |
    */
    
    'site_key' => env('VITE_RECAPTCHA_SITE_KEY', env('RECAPTCHA_SITE_KEY', '')),
    'secret_key' => env('RECAPTCHA_SECRET_KEY', ''),
    
    /*
    |--------------------------------------------------------------------------
    | Seuil de score
    |--------------------------------------------------------------------------
    |
    | Score minimum requis pour considérer la vérification comme valide (0.0 à 1.0)
    |
    */
    'score_threshold' => 0.5,
    
    /*
    |--------------------------------------------------------------------------
    | URL de vérification
    |--------------------------------------------------------------------------
    |
    | URL de vérification reCAPTCHA v3
    |
    */
    'verify_url' => 'https://www.google.com/recaptcha/api/siteverify',
    
    /*
    |--------------------------------------------------------------------------
    | Paramètres de débogage
    |--------------------------------------------------------------------------
    |
    | Activer/désactiver le mode débogage pour reCAPTCHA
    |
    */
    'debug' => env('APP_DEBUG', false),
    
    /*
    |--------------------------------------------------------------------------
    | Action par défaut
    |--------------------------------------------------------------------------
    |
    | Action par défaut pour reCAPTCHA v3
    |
    */
    'default_action' => 'submit',
    
    /*
    |--------------------------------------------------------------------------
    | Seuil de score par action
    |--------------------------------------------------------------------------
    |
    | Vous pouvez définir des seuils de score différents pour différentes actions
    |
    */
    'action_thresholds' => [
        'login' => 0.5,
        'register' => 0.5,
        'contact' => 0.4,
        'default' => 0.5,
    ],
];

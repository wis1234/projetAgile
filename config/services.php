<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'recaptcha' => [
        'site_key' => env('RECAPTCHA_SITE_KEY'),
        'secret_key' => env('RECAPTCHA_SECRET_KEY'),
        'score_threshold' => 0.5,
    ],

    'fedapay' => [
        'public_key' => env('FEDAPAY_LIVE_PUBLIC_KEY', 'pk_live_NVw62EiQ_Yu6mvPq13vuUapq'),
        'secret_key' => env('FEDAPAY_LIVE_SECRET_KEY'),
        'webhook_secret' => env('FEDAPAY_WEBHOOK_SECRET'),
        'environment' => env('FEDAPAY_ENV', 'live'), // 'live' ou 'sandbox'
        // ── Retraits (payouts) ──
        'min_withdrawal' => (int) env('WITHDRAWAL_MIN', 500),
        'payout_country' => env('FEDAPAY_PAYOUT_COUNTRY', 'bj'),
        'payout_dial_code' => env('FEDAPAY_PAYOUT_DIAL_CODE', '229'),
        // Correspondance opérateur ProJA → « mode » Fedapay. À vérifier dans votre tableau de bord Fedapay.
        'payout_modes' => [
            'mtn' => env('FEDAPAY_MODE_MTN', 'mtn_open'),
            'moov' => env('FEDAPAY_MODE_MOOV', 'moov'),
            'celtis' => env('FEDAPAY_MODE_CELTIS', 'sbin'),
        ],
    ],

    'zoom' => [
        'client_id' => env('ZOOM_CLIENT_ID'),
        'client_secret' => env('ZOOM_CLIENT_SECRET'),
        'account_id' => env('ZOOM_ACCOUNT_ID'),
        'default_user_email' => env('ZOOM_DEFAULT_USER_EMAIL'),
    ],

    'livekit' => [
    'key' => env('LIVEKIT_API_KEY'),
    'secret' => env('LIVEKIT_API_SECRET'),
    'url' => env('LIVEKIT_URL'),
],



    // ── Assistant IA ProJA ──
    'ai' => [
        'enabled' => (bool) env('AI_ENABLED', true),
        'api_key' => env('ANTHROPIC_API_KEY'),
        'model' => env('AI_MODEL', 'claude-sonnet-5-5'),
        'max_tokens' => (int) env('AI_MAX_TOKENS', 1800),
        'max_steps' => (int) env('AI_MAX_STEPS', 8),          // tours outil → réponse maximum par message
        'daily_limit' => (int) env('AI_DAILY_LIMIT', 100),    // messages par utilisateur et par jour
        'timeout' => (int) env('AI_TIMEOUT', 90),
        'provider_order' => array_values(array_filter(array_map('trim', explode(',', env('AI_PROVIDER_ORDER', 'openrouter,gemini,anthropic,openai,groq,cloudflare,ollama'))))),
        'transcription_order' => array_values(array_filter(array_map('trim', explode(',', env('AI_TRANSCRIPTION_ORDER', 'cloudflare,groq,openai'))))),
        'transcription_providers' => [
            'cloudflare' => [
                'account_id' => env('CLOUDFLARE_ACCOUNT_ID'),
                'api_token' => trim((string) env('CLOUDFLARE_AI_API_TOKEN', env('CLOUDFLARE_API_KEY', ''))),
                'model' => env('CLOUDFLARE_TRANSCRIPTION_MODEL', '@cf/openai/whisper-large-v3-turbo'),
            ],
            'groq' => [
                'base_url' => env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
                'api_key' => env('GROQ_API_KEY'),
                'model' => env('GROQ_TRANSCRIPTION_MODEL', 'whisper-large-v3-turbo'),
            ],
            'openai' => [
                'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
                'api_key' => env('OPENAI_API_KEY'),
                'model' => env('OPENAI_TRANSCRIPTION_MODEL', 'gpt-4o-mini-transcribe'),
            ],
        ],
        'providers' => [
            'anthropic' => [
                'base_url' => 'https://api.anthropic.com/v1',
                'api_key' => trim((string) env('ANTHROPIC_API_KEY', '')),
                'model' => env('AI_MODEL', 'claude-3-5-haiku-latest'),
            ],
            'groq' => [
                'base_url' => env('GROQ_BASE_URL', 'https://api.groq.com/openai/v1'),
                'api_key' => trim((string) env('GROQ_API_KEY', '')),
                'model' => env('GROQ_MODEL', 'llama-3.3-70b-versatile'),
            ],
            'openrouter' => [
                'base_url' => env('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1'),
                'api_key' => trim((string) env('OPENROUTER_API_KEY', '')),
                'model' => env('OPENROUTER_MODEL', 'openrouter/free'),
                'max_tokens' => (int) env('OPENROUTER_MAX_TOKENS', 4096),
                // openrouter/free dynamically selects models; their context capacities vary.
                'context_length' => (int) env('OPENROUTER_CONTEXT_LENGTH', 200000),
            ],
            'cloudflare' => [
                'account_id' => env('CLOUDFLARE_ACCOUNT_ID'),
                // Explicit Workers AI token only; never confuse R2 keys or account IDs with API tokens.
                'api_key' => trim((string) env('CLOUDFLARE_AI_API_TOKEN', '')),
                'base_url' => env('CLOUDFLARE_AI_BASE_URL', 'https://api.cloudflare.com/client/v4/accounts/' . env('CLOUDFLARE_ACCOUNT_ID', '') . '/ai/v1'),
                'model' => env('CLOUDFLARE_AI_MODEL', '@cf/meta/llama-3.3-70b-instruct-fp8-fast'),
            ],
            'gemini' => [
                'base_url' => env('GEMINI_BASE_URL', 'https://generativelanguage.googleapis.com/v1beta/openai'),
                'api_key' => trim((string) env('GEMINI_API_KEY', '')),
                'model' => env('GEMINI_MODEL', 'gemini-3.8-flash'),
            ],
            'openai' => [
                'base_url' => env('OPENAI_BASE_URL', 'https://api.openai.com/v1'),
                'api_key' => trim((string) env('OPENAI_API_KEY', '')),
                'model' => env('OPENAI_MODEL', 'gpt-4o-mini'),
            ],
            'ollama' => [
                'enabled' => (bool) env('OLLAMA_ENABLED', false),
                'base_url' => env('OLLAMA_BASE_URL', 'http://127.0.0.1:11434/v1'),
                'api_key' => env('OLLAMA_API_KEY'),
                'model' => env('OLLAMA_MODEL', 'llama3.1'),
            ],
        ],
    ],
];

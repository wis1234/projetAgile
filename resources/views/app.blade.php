<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title inertia>{{ config('app.name', 'Proja') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
        
        <!-- FedaPay Checkout Script -->
        @if(env('MIX_FEDAPAY_ENV') === 'sandbox')
            <script src="https://s3-us-west-2.amazonaws.com/cdn.fedapay.com/checkout.js?v=1.1.7"></script>
        @else
            <script src="https://cdn.fedapay.com/checkout.js?v=1.1.7"></script>
        @endif
        <script>
            window.FedaPayEnvironment = '{{ env('MIX_FEDAPAY_ENV', 'sandbox') }}';
        </script>
        <!-- reCAPTCHA Script -->
        <script>
            // Fonctions de rappel globales pour reCAPTCHA
            function onRecaptchaLoad() {
                console.log('reCAPTCHA chargé');
                const event = new Event('recaptcha-loaded');
                document.dispatchEvent(event);
            }
            
            function onRecaptchaSuccess(token) {
                console.log('reCAPTCHA réussi:', token);
                const event = new CustomEvent('recaptcha-verified', { detail: { token } });
                document.dispatchEvent(event);
            }
            
            function onRecaptchaExpired() {
                console.log('reCAPTCHA expiré');
                const event = new Event('recaptcha-expired');
                document.dispatchEvent(event);
            }
            
            function onRecaptchaError() {
                console.error('Erreur reCAPTCHA');
                const event = new Event('recaptcha-error');
                document.dispatchEvent(event);
            }
            
            // Définir les fonctions globales pour les callbacks
            window.onRecaptchaLoad = onRecaptchaLoad;
            window.onRecaptchaSuccess = onRecaptchaSuccess;
            window.onRecaptchaExpired = onRecaptchaExpired;
            window.onRecaptchaError = onRecaptchaError;
            
            // Charger reCAPTCHA de manière asynchrone
            function loadRecaptcha() {
                const script = document.createElement('script');
                script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
                script.async = true;
                script.defer = true;
                document.head.appendChild(script);
            }
            
            // Démarrer le chargement de reCAPTCHA
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', loadRecaptcha);
            } else {
                loadRecaptcha();
            }
        </script>
        <style>
            .grecaptcha-badge { 
                visibility: visible !important;
                z-index: 1000;
            }
            #recaptcha-element {
                margin: 10px 0;
                min-height: 78px;
                display: flex;
                justify-content: center;
            }
            .g-recaptcha > div {
                margin: 0 auto;
            }
        </style>
        <script>
            // Fonction appelée quand reCAPTCHA est chargé
            function onRecaptchaLoad() {
                // Événement personnalisé pour indiquer que reCAPTCHA est prêt
                const event = new Event('recaptcha-loaded');
                document.dispatchEvent(event);
            }
            
            // Fonction de rappel pour le succès de reCAPTCHA
            window.onRecaptchaSuccess = function(token) {
                const event = new CustomEvent('recaptcha-verified', { detail: { token } });
                document.dispatchEvent(event);
            };
            
            // Fonction de rappel pour l'expiration de reCAPTCHA
            window.onRecaptchaExpired = function() {
                const event = new Event('recaptcha-expired');
                document.dispatchEvent(event);
            };
            
            // Fonction de rappel pour les erreurs reCAPTCHA
            window.onRecaptchaError = function() {
                const event = new Event('recaptcha-error');
                document.dispatchEvent(event);
            };
        </script>
        <script>
            window.recaptchaCallback = function() {
                window.recaptchaReady = true;
            };
        </script>
        <style>
            .grecaptcha-badge { 
                visibility: visible !important;
                z-index: 1000;
            }
        </style>
    </head>
    <body class="font-sans antialiased">
        @inertia
        @if (isset($exception) && $exception->getStatusCode() === 403)
            <div class="min-h-screen flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900">
                <div class="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-10 flex flex-col items-center">
                    <svg class="w-20 h-20 text-red-500 mb-6" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M21 12A9 9 0 1 1 3 12a9 9 0 0 1 18 0z" /></svg>
                    <h1 class="text-4xl font-bold text-red-600 mb-2">Accès refusé</h1>
                    <p class="text-lg text-gray-700 dark:text-gray-300 mb-6">Vous n'avez pas les droits nécessaires pour accéder à cette page.<br>Si vous pensez qu'il s'agit d'une erreur, contactez un administrateur.</p>
                    <a href="/" class="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold shadow hover:bg-blue-700 transition">Retour à l'accueil</a>
                </div>
                <div class="mt-8 text-gray-400 text-sm">&copy; {{ date('Y') }} ProJA</div>
            </div>
        @endif
    </body>
</html>

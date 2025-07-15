<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Laravel') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=figtree:400,500,600&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @routes
        @viteReactRefresh
        @vite(['resources/js/app.jsx', "resources/js/Pages/{$page['component']}.jsx"])
        @inertiaHead
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
                <div class="mt-8 text-gray-400 text-sm">&copy; {{ date('Y') }} ProJA - Agile Manager</div>
            </div>
        @endif
    </body>
</html>

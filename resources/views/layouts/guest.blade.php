<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">

        <title>{{ config('app.name', 'HoneyBee Escorts') }}</title>

        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">

        <!-- Scripts -->
        @vite(['resources/css/app.css', 'resources/js/app.js'])
        @livewireStyles
    </head>
    <body class="font-sans text-ink-950 antialiased">
        <div class="flex min-h-screen flex-col items-center bg-ivory-50 px-4 pt-8 sm:justify-center sm:pt-0">
            <div>
                <a href="/" class="font-display text-2xl font-semibold tracking-wide">
                    HoneyBee <span class="text-gold-400">Escorts</span>
                </a>
            </div>

            <div class="mt-6 w-full overflow-hidden rounded-2xl border border-gold-400/20 bg-ebony-850 px-6 py-5 shadow-2xl shadow-ink-950/10 sm:max-w-md">
                {{ $slot }}
            </div>
        </div>
        @livewireScriptConfig
    </body>
</html>

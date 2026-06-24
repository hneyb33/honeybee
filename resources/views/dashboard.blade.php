<x-app-layout>
    <x-slot name="header">
        <h2 class="font-semibold text-xl text-ink-950 leading-tight">
            {{ __('Dashboard') }}
        </h2>
    </x-slot>

    <div class="py-12">
        <div class="max-w-7xl mx-auto sm:px-6 lg:px-8">
            <div class="bg-ebony-850 overflow-hidden shadow-sm sm:rounded-lg">
                <div class="p-6 text-ink-950">
                    {{ __("You're logged in!") }}
                </div>
            </div>
        </div>
    </div>
</x-app-layout>

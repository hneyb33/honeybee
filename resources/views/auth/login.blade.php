<x-guest-layout>
    <div class="mb-8">
        <h1 class="font-display text-3xl font-semibold text-[#0f0a0a] dark:text-white">Welcome back</h1>
        <p class="mt-3 text-sm leading-6 text-[#767f88]">Log in with the phone number you registered with to update your profile, manage availability, and respond to new bookings.</p>
    </div>

    <!-- Session Status -->
    <x-auth-session-status class="mb-4" :status="session('status')" />

    <form method="POST" action="{{ route('login') }}">
        @csrf
        <div>
            <x-input-label for="phone" :value="__('Phone number')" />
            <x-text-input id="phone" class="block mt-1 w-full" type="tel" inputmode="tel" name="phone" :value="old('phone')" placeholder="0771234567" required autofocus autocomplete="tel" />
            <x-input-error :messages="$errors->get('phone')" class="mt-2" />
        </div>

        <!-- Password -->
        <div class="mt-4">
            <x-input-label for="password" :value="__('Password')" />

            <x-password-input id="password" name="password" class="mt-1" autocomplete="current-password" />

            <x-input-error :messages="$errors->get('password')" class="mt-2" />
        </div>

        <!-- Remember Me -->
        <div class="block mt-4">
            <label for="remember_me" class="inline-flex items-center">
                <input id="remember_me" type="checkbox" class="rounded border-[#767f88] bg-white text-[#0f0a0a] shadow-sm focus:ring-[#767f88]" name="remember">
                <span class="ms-2 text-sm text-[#767f88]">{{ __('Remember me') }}</span>
            </label>
        </div>

        <div class="flex items-center justify-end mt-4">
            @if (Route::has('password.request'))
                <a class="rounded-md text-sm text-[#767f88] underline hover:text-[#0f0a0a] focus:outline-none focus:ring-2 focus:ring-[#767f88] focus:ring-offset-2 dark:hover:text-white" href="{{ route('password.request') }}">
                    {{ __('Forgot your password?') }}
                </a>
            @endif

            <x-primary-button class="ms-3 gap-2">
                <x-lucide name="log-in" /> {{ __('Log in') }}
            </x-primary-button>
        </div>
    </form>
</x-guest-layout>

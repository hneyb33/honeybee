<x-guest-layout>
    @php
        $copy = [
            'client' => ['Join as a client', 'Browse verified profiles and contact them on WhatsApp or Telegram.'],
            'model' => ['Join as a model', 'Create an escort profile with your services, rates, and photos.'],
            'specialist' => ['Join as a specialist', 'Offer a home service such as private chef, laundry, or massage.'],
        ][$role];
    @endphp
    <h1 class="text-2xl font-semibold text-neutral-900">{{ $copy[0] }}</h1>
    <p class="mt-2 text-sm text-neutral-600">{{ $copy[1] }}</p>

    <form method="POST" action="{{ route('register') }}" class="mt-6">
        @csrf
        <input type="hidden" name="account_type" value="{{ $role }}">

        <div>
            <x-input-label for="username" :value="__('Username')" />
            <x-text-input id="username" class="mt-1 block w-full" type="text" name="username" :value="old('username')" required autofocus autocomplete="username" />
            <x-input-error :messages="$errors->get('username')" class="mt-2" />
        </div>
        <div class="mt-4">
            <x-input-label for="phone" :value="__('Phone number')" />
            <x-phone-field id="phone" />
            <p class="mt-1 text-xs text-neutral-500">You will use this number to log in. The country code is saved with it.</p>
            <x-input-error :messages="$errors->get('phone')" class="mt-2" />
            <x-input-error :messages="$errors->get('phone_country')" class="mt-2" />
        </div>
        <div class="mt-4">
            <x-input-label for="email" :value="__('Email (optional)')" />
            <x-text-input id="email" class="mt-1 block w-full" type="email" name="email" :value="old('email')" autocomplete="email" />
            <p class="mt-1 text-xs text-neutral-500">Only needed if you want to reset your password by email.</p>
            <x-input-error :messages="$errors->get('email')" class="mt-2" />
        </div>
        <div class="mt-4">
            <x-input-label for="password" :value="__('Password')" />
            <x-password-input id="password" name="password" class="mt-1" autocomplete="new-password" />
            <x-input-error :messages="$errors->get('password')" class="mt-2" />
        </div>
        <div class="mt-4">
            <x-input-label for="password_confirmation" :value="__('Confirm password')" />
            <x-password-input id="password_confirmation" name="password_confirmation" class="mt-1" autocomplete="new-password" />
        </div>
        <div class="mt-6 flex items-center justify-between">
            <a href="{{ route('register') }}" class="text-sm text-neutral-600 underline">Back</a>
            <x-primary-button class="gap-2"><x-lucide name="user-plus" /> Create account</x-primary-button>
        </div>
    </form>
</x-guest-layout>

<x-guest-layout>
    @php
        $copy = [
            'client' => ['Join as a client', 'Browse verified profiles, request bookings, and leave reviews.'],
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
            <x-input-label for="name" :value="__('Name')" />
            <x-text-input id="name" class="mt-1 block w-full" type="text" name="name" :value="old('name')" required autofocus />
            <x-input-error :messages="$errors->get('name')" class="mt-2" />
        </div>
        <div class="mt-4">
            <x-input-label for="email" :value="__('Email')" />
            <x-text-input id="email" class="mt-1 block w-full" type="email" name="email" :value="old('email')" required />
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

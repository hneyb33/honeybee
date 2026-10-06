<section>
    <header>
        <h2 class="text-lg font-medium text-ink-950">
            {{ __('Profile Information') }}
        </h2>

        <p class="mt-1 text-sm text-ebony-900/70">
            {{ __("Update your account's profile information and login phone number.") }}
        </p>
    </header>

    <form id="send-verification" method="post" action="{{ route('verification.send') }}">
        @csrf
    </form>

    <form method="post" action="{{ route('profile.update') }}" class="mt-6 space-y-6">
        @csrf
        @method('patch')

        @php
            [$phoneCountry, $phoneNational] = \App\Support\CountryDialCodes::split($user->phone, $user->phone_country);
        @endphp
        <div>
            <x-input-label for="username" :value="__('Username')" />
            <x-text-input id="username" name="username" type="text" class="mt-1 block w-full" :value="old('username', $user->name)" required autofocus autocomplete="username" />
            <x-input-error class="mt-2" :messages="$errors->get('username')" />
        </div>

        <div>
            <x-input-label for="phone" :value="__('Phone number')" />
            <x-phone-field id="phone" :country="$phoneCountry" :national="$phoneNational" />
            <p class="mt-1 text-sm text-ebony-900/70">{{ __('You log in with this number. The country code stays saved with it.') }}</p>
            <x-input-error class="mt-2" :messages="$errors->get('phone')" />
            <x-input-error class="mt-2" :messages="$errors->get('phone_country')" />
        </div>

        <div>
            <x-input-label for="email" :value="__('Email (optional)')" />
            <x-text-input id="email" name="email" type="email" class="mt-1 block w-full" :value="old('email', $user->email)" autocomplete="email" />
            <x-input-error class="mt-2" :messages="$errors->get('email')" />

            @if ($user instanceof \Illuminate\Contracts\Auth\MustVerifyEmail && ! $user->hasVerifiedEmail())
                <div>
                    <p class="text-sm mt-2 text-ink-950">
                        {{ __('Your email address is unverified.') }}

                        <button form="send-verification" class="underline text-sm text-ebony-900/70 hover:text-ink-950 hover:text-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gold-400">
                            {{ __('Click here to re-send the verification email.') }}
                        </button>
                    </p>

                    @if (session('status') === 'verification-link-sent')
                        <p class="mt-2 font-medium text-sm text-green-600 text-green-400">
                            {{ __('A new verification link has been sent to your email address.') }}
                        </p>
                    @endif
                </div>
            @endif
        </div>

        <div class="flex items-center gap-4">
            <x-primary-button>{{ __('Save') }}</x-primary-button>

            @if (session('status') === 'profile-updated')
                <p
                    x-data="{ show: true }"
                    x-show="show"
                    x-transition
                    x-init="setTimeout(() => show = false, 2000)"
                    class="text-sm text-ebony-900/70"
                >{{ __('Saved.') }}</p>
            @endif
        </div>
    </form>
</section>

<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Support\PhoneNumber;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\Rules;
use Illuminate\Validation\ValidationException;
use Illuminate\View\View;

class RegisteredUserController extends Controller
{
    /**
     * Display the registration view.
     */
    public function create(Request $request): View
    {
        $role = $request->route('role');

        if (! in_array($role, ['client', 'model', 'specialist'], true)) {
            return view('auth.register-choice');
        }

        return view('auth.register', ['role' => $role]);
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $country = preg_replace('/\D+/', '', (string) $request->input('phone_country', '256')) ?: '256';
        $national = PhoneNumber::national($country, $request->input('phone'));
        $phone = PhoneNumber::compose($country, $national);

        $request->merge([
            'phone_country' => $country,
            'phone' => $national,
            'username' => trim((string) $request->input('username')),
        ]);

        $request->validate([
            'username' => ['required', 'string', 'min:3', 'max:30', 'regex:/^[A-Za-z][A-Za-z0-9_]+$/', 'unique:users,name'],
            'phone_country' => ['required', 'in:'.implode(',', \App\Support\CountryDialCodes::codes())],
            'phone' => ['required', 'regex:/^\d{6,12}$/'],
            'email' => ['nullable', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'account_type' => ['required', 'in:client,model,specialist'],
        ], [
            'username.unique' => 'That username is already taken.',
            'username.regex' => 'Use letters, numbers, and underscores. Start with a letter.',
            'phone.regex' => 'Enter the phone number without the country code.',
        ]);

        if (User::query()->where('phone', $phone)->exists()) {
            throw ValidationException::withMessages([
                'phone' => 'That phone number already has an account.',
            ]);
        }

        $kind = $request->input('account_type');
        $user = User::create([
            'name' => $request->username,
            'phone' => $phone,
            'phone_country' => $country,
            'email' => $request->email ?: null,
            'password' => $request->password,
            'account_kind' => $kind,
        ]);

        $user->assignRole($kind === 'client' ? 'client_free' : 'provider_free');

        event(new Registered($user));

        Auth::login($user);

        return redirect()->route(match ($kind) {
            'client' => 'home',
            'specialist' => 'provider.onboard',
            default => 'owner.escorts.create',
        });
    }
}

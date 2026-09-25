<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
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
        $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'lowercase', 'email', 'max:255', 'unique:'.User::class],
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'account_type' => ['required', 'in:client,model,specialist'],
        ]);

        $kind = $request->input('account_type');
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
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

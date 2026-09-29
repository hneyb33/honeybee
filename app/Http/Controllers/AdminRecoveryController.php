<?php
namespace App\Http\Controllers;

use App\Models\Setting;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;
use Spatie\Permission\Models\Role;

class AdminRecoveryController extends Controller
{
    private function enabled(): bool
    {
        return (bool) config('admin_recovery.enabled');
    }

    public function show()
    {
        abort_unless($this->enabled(), 404);

        return view('auth.admin-recovery');
    }

    public function store(Request $request)
    {
        abort_unless($this->enabled(), 404);

        $key = 'admin-recovery:'.$request->ip();

        if (RateLimiter::tooManyAttempts($key, 5)) {
            abort(429, 'Too many attempts. Try again later.');
        }

        RateLimiter::hit($key, 3600);

        $data = $request->validate([
            'token' => ['required', 'string'],
            'name' => ['required', 'string', 'max:255'],
            'email' => [
                'required', 'email', 'max:255',
                'unique:users,email',
            ],
            'password' => [
                'required', 'confirmed',
                Password::min(12)
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
        ]);

        $expected = config('admin_recovery.token_hash');

        if (
            ! is_string($expected) ||
            strlen($expected) !== 64 ||
            ! hash_equals(
                $expected,
                hash('sha256', $data['token'])
            )
        ) {
            return back()->withErrors([
                'token' => 'Invalid recovery credentials.',
            ])->withInput($request->only('name', 'email'));
        }

        $created = DB::transaction(function () use ($data) {
            // Serialize recovery attempts on PostgreSQL.
            DB::select(
                'SELECT pg_advisory_xact_lock(482193, 2026)'
            );

            if (Setting::get('admin_recovery_consumed') === '1') {
                return false;
            }

            $role = Role::query()
                ->where('name', 'super_admin')
                ->where('guard_name', 'web')
                ->firstOrFail();

            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => Hash::make($data['password']),
            ]);

            $user->assignRole($role);

            Setting::put('super_admin_registered', '1');
            Setting::put('admin_recovery_consumed', '1');

            return true;
        });

        if (! $created) {
            abort(403, 'Recovery has already been used.');
        }

        RateLimiter::clear($key);

        return redirect(filament()->getLoginUrl())
            ->with(
                'status',
                'Account created. Sign in with your new credentials.'
            );
    }
}

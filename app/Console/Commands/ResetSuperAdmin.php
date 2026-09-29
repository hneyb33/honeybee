<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rules\Password;

class ResetSuperAdmin extends Command
{
    protected $signature = 'admin:reset-super';

    protected $description = 'Update an existing super admin account';

    public function handle(): int
    {
        if (config('database.default') !== 'pgsql') {
            $this->error('Expected PostgreSQL. Aborting.');
            return self::FAILURE;
        }

        $database = DB::connection();
        $database->getPdo();

        $this->warn(
            'Connected to '.$database->getDatabaseName().
            ' on '.config('database.connections.pgsql.host')
        );

        if (! $this->confirm(
            'Have you verified this is the intended database and taken a backup?',
            false
        )) {
            return self::FAILURE;
        }

        $currentEmail = $this->ask('Current super admin email');

        $user = User::where('email', $currentEmail)->first();

        if (! $user || ! $user->hasRole('super_admin')) {
            $this->error('Existing super admin not found.');
            return self::FAILURE;
        }

        $this->info('Account found: '.$user->name);

        $newEmail = $this->ask(
            'New email',
            $user->email
        );

        $password = $this->secret('New password');
        $confirmation = $this->secret('Confirm new password');

        $validator = Validator::make([
            'email' => $newEmail,
            'password' => $password,
            'password_confirmation' => $confirmation,
        ], [
            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email,'.$user->id,
            ],
            'password' => [
                'required',
                'confirmed',
                Password::min(12)->mixedCase()->numbers()->symbols(),
            ],
        ]);

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $error) {
                $this->error($error);
            }

            return self::FAILURE;
        }

        if (! $this->confirm(
            'Apply these credentials to the selected account?',
            false
        )) {
            return self::FAILURE;
        }

        DB::transaction(function () use (
            $user,
            $newEmail,
            $password
        ) {
            $user->forceFill([
                'email' => $newEmail,
                'password' => Hash::make($password),
                'email_verified_at' => null,
                'remember_token' => null,
            ])->save();
        });

        $this->info('Super admin credentials updated.');

        return self::SUCCESS;
    }
}

<?php

use App\Models\Setting;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Contracts\Console\Kernel;

require __DIR__.'/vendor/autoload.php';

$app = require __DIR__.'/bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$expected = $argv[1] ?? 'local';
$connection = (string) config('database.default');

if ($expected === 'production' && $connection === 'sqlite') {
    fwrite(STDERR, "Refusing to reset production admin against sqlite.\n");
    exit(1);
}

if ($expected === 'local' && $connection !== 'sqlite') {
    fwrite(STDERR, "Refusing to reset the local admin against {$connection}.\n");
    exit(1);
}

(new RolesAndPermissionsSeeder)->run();

$email = 'hneybee49@gmail.com';

User::role('super_admin')->where('email', '!=', $email)->get()->each(function (User $user): void {
    $user->removeRole('super_admin');
});

$user = User::query()->where('email', $email)->first();

if (! $user) {
    $user = User::create([
        'name' => 'Honeybee',
        'email' => $email,
        'password' => 'honeyb33',
    ]);
} else {
    $user->forceFill([
        'password' => 'honeyb33',
    ])->save();
}

$user->syncRoles(['super_admin']);
Setting::put('super_admin_registered', '1');

echo (Illuminate\Support\Facades\Hash::check('honeyb33', $user->fresh()->password) ? 'password-ok' : 'password-bad'), PHP_EOL;
echo implode(' ', [
    $connection,
    (string) $user->id,
    $user->email,
    $user->fresh()->isSuperAdmin() ? 'super_admin' : 'missing-role',
    Setting::get('super_admin_registered'),
]), PHP_EOL;

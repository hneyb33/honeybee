<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolesAndPermissionsSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            'access admin',
            'invite admins',
            'manage escorts',
            'verify escorts',
            'manage bookings',
            'manage users',
            'manage profile',
            'view own dashboard',
            'view vip profiles',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        $roles = [
            'super_admin' => $permissions,
            'moderator' => ['access admin', 'verify escorts', 'manage bookings', 'manage profile'],
            'provider_free' => ['manage profile', 'view own dashboard'],
            'provider_premium' => ['manage profile', 'manage escorts', 'view own dashboard', 'manage bookings'],
            'client_free' => ['manage profile', 'view own dashboard', 'manage bookings'],
            'client_premium' => ['manage profile', 'view own dashboard', 'manage bookings', 'view vip profiles'],
        ];

        foreach ($roles as $name => $rolePermissions) {
            $role = Role::firstOrCreate(['name' => $name]);
            $role->syncPermissions($rolePermissions);
        }

        Role::query()->whereIn('name', ['agency', 'client_guest', 'client_loggedin'])->delete();
    }
}

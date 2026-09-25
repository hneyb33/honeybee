<?php

use App\Models\User;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

it('assigns roles and permissions to a user', function () {
    $user = User::factory()->create();

    $role = Role::create(['name' => 'super_admin']);
    $permission = Permission::create(['name' => 'access admin']);
    $role->givePermissionTo($permission);
    $user->assignRole($role);

    expect($user->hasRole('super_admin'))->toBeTrue()
        ->and($user->can('access admin'))->toBeTrue();
});

<?php

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Tests\TestCase;

uses(TestCase::class, RefreshDatabase::class);

it('assigns roles and permissions to a user', function () {
    $user = User::factory()->create();

    $role = Role::create(['name' => 'super_admin']);
    $permission = Permission::create(['name' => 'access admin']);
    $role->givePermissionTo($permission);
    $user->assignRole($role);

    expect($user->hasRole('super_admin'))->toBeTrue()
        ->and($user->can('access admin'))->toBeTrue();
});

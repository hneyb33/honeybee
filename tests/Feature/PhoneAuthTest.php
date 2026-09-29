<?php

namespace Tests\Feature;

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PhoneAuthTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_registration_stores_the_phone_in_international_form_without_an_email(): void
    {
        $this->post(route('register'), [
            'name' => 'Phone Client',
            'phone' => '0771234567',
            'password' => 'honeybee-secret-1',
            'password_confirmation' => 'honeybee-secret-1',
            'account_type' => 'client',
        ])->assertRedirect(route('home'));

        $user = User::query()->where('phone', '256771234567')->firstOrFail();

        $this->assertNull($user->email);
        $this->assertTrue($user->hasRole('client_free'));
        $this->assertAuthenticatedAs($user);
    }

    public function test_a_local_or_international_phone_format_logs_the_same_user_in(): void
    {
        $user = User::factory()->create([
            'phone' => '256772000111',
            'password' => 'honeybee-secret-1',
        ]);

        foreach (['0772000111', '+256 772 000 111', '256772000111'] as $entered) {
            $this->post(route('login'), [
                'phone' => $entered,
                'password' => 'honeybee-secret-1',
            ])->assertRedirect(route('dashboard', absolute: false));

            $this->assertAuthenticatedAs($user);
            $this->post(route('logout'));
        }
    }

    public function test_an_email_address_is_not_accepted_as_a_login(): void
    {
        $user = User::factory()->create([
            'email' => 'phone-login@example.com',
            'phone' => '256772000222',
            'password' => 'honeybee-secret-1',
        ]);

        $this->from(route('login'))
            ->post(route('login'), [
                'phone' => $user->email,
                'password' => 'honeybee-secret-1',
            ])
            ->assertSessionHasErrors('phone');

        $this->assertGuest();
    }

    public function test_a_phone_number_cannot_be_registered_twice(): void
    {
        User::factory()->create(['phone' => '256772000333']);

        $this->from(route('register.form', 'client'))
            ->post(route('register'), [
                'name' => 'Duplicate',
                'phone' => '0772000333',
                'password' => 'honeybee-secret-1',
                'password_confirmation' => 'honeybee-secret-1',
                'account_type' => 'client',
            ])
            ->assertSessionHasErrors('phone');

        $this->assertGuest();
    }
}

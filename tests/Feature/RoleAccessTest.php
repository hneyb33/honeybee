<?php

namespace Tests\Feature;

use App\Models\Escort;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RoleAccessTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_unverified_profiles_are_hidden(): void
    {
        $specialist = User::factory()->create();
        $specialist->assignRole('provider_premium');
        $specialist->activatePlan(Subscription::PLAN_SPECIALIST);

        Escort::create($this->profile($specialist, [
            'verification_status' => 'pending',
            'slug' => 'pending-profile',
        ]));

        $this->assertSame(0, Escort::query()->published()->count());
    }

    public function test_verified_profiles_without_a_subscription_are_hidden(): void
    {
        $specialist = User::factory()->create();
        $specialist->assignRole('provider_free');

        Escort::create($this->profile($specialist, [
            'verification_status' => 'verified',
            'slug' => 'unsubscribed-profile',
        ]));

        $this->assertSame(0, Escort::query()->published()->count());
    }

    public function test_verified_subscribed_profiles_are_published(): void
    {
        $specialist = User::factory()->create();
        $specialist->assignRole('provider_free');
        $specialist->activatePlan(Subscription::PLAN_SPECIALIST);

        Escort::create($this->profile($specialist, [
            'verification_status' => 'verified',
            'slug' => 'live-profile',
        ]));

        $this->assertSame(1, Escort::query()->published()->count());
        $this->assertTrue($specialist->fresh()->hasRole('provider_premium'));
    }

    public function test_vip_profiles_are_hidden_from_free_clients(): void
    {
        $specialist = User::factory()->create();
        $specialist->activatePlan(Subscription::PLAN_SPECIALIST);

        Escort::create($this->profile($specialist, [
            'verification_status' => 'verified',
            'escort_tier' => 'vip',
            'slug' => 'vip-profile',
        ]));

        $free = User::factory()->create();
        $free->assignRole('client_free');

        $premium = User::factory()->create();
        $premium->assignRole('client_free');
        $premium->activatePlan(Subscription::PLAN_CLIENT_PREMIUM);

        $this->assertSame(0, Escort::query()->visibleTo($free)->count());
        $this->assertSame(1, Escort::query()->visibleTo($premium)->count());
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function profile(User $owner, array $overrides): array
    {
        return array_merge([
            'user_id' => $owner->id,
            'title' => 'Amina',
            'slug' => 'amina',
            'description' => str_repeat('Discreet specialist profile. ', 4),
            'tier' => 'premium',
            'kind' => 'escort',
            'escort_tier' => 'premium',
            'category' => 'escort',
            'status' => 'active',
            'neighborhood' => 'Kololo',
            'city' => 'Kampala',
            'monthly_price' => 150000,
            'hourly_rate' => 150000,
            'whatsapp_number' => '256700000000',
            'verification_status' => 'pending',
        ], $overrides);
    }
}

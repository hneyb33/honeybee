<?php

namespace Tests\Feature;

use App\Models\Setting;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminSettingsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_subscription_page_uses_admin_prices(): void
    {
        Setting::put('client_premium_monthly_price', '45000');

        $client = User::factory()->create(['account_kind' => 'client']);
        $client->assignRole('client_free');

        $this->actingAs($client)
            ->get(route('subscribe'))
            ->assertOk()
            ->assertSee('45,000');
    }

    public function test_activating_a_plan_stores_the_admin_price_and_period(): void
    {
        Setting::put('specialist_yearly_price', '800000');

        $specialist = User::factory()->create(['account_kind' => 'model']);
        $specialist->assignRole('provider_free');
        $subscription = $specialist->activatePlan(Subscription::PLAN_SPECIALIST, 'yearly');

        $this->assertSame('yearly', $subscription->period);
        $this->assertSame(800000, $subscription->price_amount);
        $this->assertTrue($specialist->fresh()->hasRole('provider_premium'));
        $this->assertTrue($subscription->ends_at->greaterThan(now()->addMonths(11)));
    }
}

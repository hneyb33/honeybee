<?php

namespace Tests\Feature;

use App\Livewire\Listings\ListingGrid;
use App\Livewire\Listings\TierFilter;
use App\Models\Escort;
use App\Models\Setting;
use App\Models\Subscription;
use App\Models\User;
use App\Services\PaymentService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class DiscoveryTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_admin_merchant_code_is_shown_on_the_payment_page(): void
    {
        config([
            'payments.mtn.merchant_code' => null,
            'payments.airtel.merchant_code' => null,
        ]);
        Setting::put('mtn_momo_merchant_code', '778899');
        Setting::put('client_premium_monthly_price', '50000');

        $client = User::factory()->create(['account_kind' => 'client']);
        $client->assignRole('client_free');

        $payment = app(PaymentService::class)->start($client, Subscription::PLAN_CLIENT_PREMIUM, 'monthly', 'mtn_momo');

        $this->actingAs($client)
            ->get(route('payments.show', $payment))
            ->assertOk()
            ->assertSee('778899')
            ->assertSee('*165*3#');

        $this->assertFalse($client->fresh()->hasRole('client_premium'));
    }

    public function test_free_clients_are_sent_to_subscribe_for_vip_profiles(): void
    {
        $owner = User::factory()->create(['account_kind' => 'model']);
        $owner->assignRole('provider_free');
        $owner->activatePlan(Subscription::PLAN_ESCORT_VIP);

        $escort = Escort::create($this->profile($owner, [
            'verification_status' => 'verified',
            'escort_tier' => 'vip',
            'tier' => 'vip',
            'slug' => 'vip-profile',
            'sexual_orientation' => 'straight',
        ]));

        $client = User::factory()->create(['account_kind' => 'client']);
        $client->assignRole('client_free');

        $this->withSession(['allowed_age' => true])
            ->actingAs($client)
            ->get(route('escort.show', $escort))
            ->assertRedirect(route('subscribe'))
            ->assertSessionHas('status', 'A subscription is required to browse VIP profiles.');

        Livewire::actingAs($client)
            ->test(TierFilter::class)
            ->call('setTier', 'vip')
            ->assertRedirect(route('subscribe'));
    }

    public function test_premium_profiles_need_a_client_subscription_to_open(): void
    {
        $owner = User::factory()->create(['account_kind' => 'model']);
        $owner->assignRole('provider_free');
        $owner->activatePlan(Subscription::PLAN_ESCORT_PREMIUM);

        $escort = Escort::create($this->profile($owner, [
            'verification_status' => 'verified',
            'slug' => 'premium-profile',
        ]));

        $client = User::factory()->create(['account_kind' => 'client']);
        $client->assignRole('client_free');

        $this->withSession(['allowed_age' => true])
            ->actingAs($client)
            ->get(route('escort.show', $escort))
            ->assertRedirect(route('subscribe'))
            ->assertSessionHas('status', 'A subscription is required to browse premium profiles.');

        $client->activatePlan(Subscription::PLAN_CLIENT_BASIC);

        $this->withSession(['allowed_age' => true])
            ->actingAs($client->fresh())
            ->get(route('escort.show', $escort))
            ->assertOk();
    }

    public function test_search_uses_location_category_and_service(): void
    {
        $owner = User::factory()->create(['account_kind' => 'specialist']);
        $owner->assignRole('provider_free');
        $owner->activatePlan(Subscription::PLAN_SPECIALIST);

        Escort::create($this->profile($owner, [
            'title' => 'Straight Kololo',
            'slug' => 'straight-kololo',
            'sexual_orientation' => 'straight',
            'neighborhood' => 'Kololo',
            'city' => 'Kampala',
            'verification_status' => 'verified',
        ]));
        Escort::create($this->profile($owner, [
            'title' => 'Lesbian Kololo',
            'slug' => 'lesbian-kololo',
            'sexual_orientation' => 'lesbian',
            'neighborhood' => 'Kololo',
            'city' => 'Kampala',
            'verification_status' => 'verified',
        ]));
        Escort::create($this->profile($owner, [
            'title' => 'Chef Kololo',
            'slug' => 'chef-kololo',
            'kind' => 'service',
            'escort_tier' => null,
            'service_type' => 'private_chef',
            'neighborhood' => 'Kololo',
            'city' => 'Kampala',
            'verification_status' => 'verified',
        ]));
        Escort::create($this->profile($owner, [
            'title' => 'Massage Bugolobi',
            'slug' => 'massage-bugolobi',
            'kind' => 'service',
            'escort_tier' => null,
            'service_type' => 'private_massage',
            'neighborhood' => 'Bugolobi',
            'city' => 'Kampala',
            'verification_status' => 'verified',
        ]));

        $component = Livewire::test(ListingGrid::class)
            ->call('updateFilters', [
                'location' => 'Kampala|Kololo',
                'category' => 'straight',
                'service_type' => 'private_chef',
                'latitude' => null,
                'longitude' => null,
            ]);

        $titles = $component->viewData('popular')->pluck('title')->all();

        $this->assertEqualsCanonicalizing(['Straight Kololo', 'Chef Kololo'], $titles);
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
            'sexual_orientation' => 'straight',
        ], $overrides);
    }
}

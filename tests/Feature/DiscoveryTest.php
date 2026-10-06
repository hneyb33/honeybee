<?php

namespace Tests\Feature;

use App\Livewire\Listings\ListingGrid;
use App\Livewire\Search\CapsuleSearch;
use App\Livewire\Listings\TierFilter;
use App\Models\Escort;
use App\Models\Place;
use App\Models\Setting;
use App\Models\Subscription;
use App\Models\User;
use App\Services\PaymentService;
use App\Support\Places;
use Illuminate\Support\Facades\Http;
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

    public function test_premium_and_service_profiles_open_without_a_client_subscription(): void
    {
        $owner = User::factory()->create(['account_kind' => 'model']);
        $owner->assignRole('provider_free');
        $owner->activatePlan(Subscription::PLAN_ESCORT_PREMIUM);

        $escort = Escort::create($this->profile($owner, [
            'verification_status' => 'verified',
            'slug' => 'premium-profile',
        ]));

        $specialist = User::factory()->create(['account_kind' => 'specialist']);
        $specialist->assignRole('provider_free');
        $specialist->activatePlan(Subscription::PLAN_SPECIALIST);

        $service = Escort::create($this->profile($specialist, [
            'title' => 'Home chef',
            'slug' => 'home-chef',
            'kind' => 'service',
            'escort_tier' => null,
            'service_type' => 'private_chef',
            'verification_status' => 'verified',
        ]));

        $client = User::factory()->create(['account_kind' => 'client']);
        $client->assignRole('client_free');

        $this->withSession(['allowed_age' => true])
            ->actingAs($client)
            ->get(route('escort.show', $escort))
            ->assertOk()
            ->assertDontSee('Reserve');

        $this->withSession(['allowed_age' => true])
            ->actingAs($client)
            ->get(route('escort.show', $service))
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

    public function test_a_typed_place_is_stored_with_coordinates_and_can_be_searched(): void
    {
        Http::preventStrayRequests();

        $owner = User::factory()->create(['account_kind' => 'model']);
        $owner->assignRole('provider_free');
        $owner->activatePlan(Subscription::PLAN_ESCORT_PREMIUM);

        $pinned = Places::pin('Kampala', 'kitooro landing', 0.051, 32.465, $owner->id);

        $this->assertSame('Kitooro Landing', $pinned['area']);
        $this->assertDatabaseHas('places', [
            'name' => 'Kitooro Landing',
            'city' => 'Kampala',
            'created_by' => $owner->id,
        ]);
        $this->assertEqualsWithDelta(0.051, (float) Place::query()->first()->latitude, 0.0001);
        $this->assertEqualsWithDelta(32.465, (float) Place::query()->first()->longitude, 0.0001);

        Escort::create($this->profile($owner, [
            'title' => 'Landing Host',
            'slug' => 'landing-host',
            'neighborhood' => $pinned['area'],
            'city' => $pinned['city'],
            'latitude' => $pinned['latitude'],
            'longitude' => $pinned['longitude'],
            'verification_status' => 'verified',
        ]));
        Escort::create($this->profile($owner, [
            'title' => 'Gulu Host',
            'slug' => 'gulu-host',
            'neighborhood' => 'Gulu',
            'city' => 'Gulu',
            'verification_status' => 'verified',
        ]));

        $titles = Livewire::test(ListingGrid::class)
            ->call('updateFilters', [
                'location' => 'Kitooro Landing, Kampala',
                'category' => '',
                'service_type' => '',
                'latitude' => null,
                'longitude' => null,
            ])
            ->viewData('popular')
            ->pluck('title')
            ->all();

        $this->assertContains('Landing Host', $titles);
        $this->assertNotContains('Gulu Host', $titles);
        $this->assertSame(1, Place::query()->count());
    }

    public function test_location_lookup_uses_the_library_before_asking_for_a_pin(): void
    {
        Http::fake();

        $known = Places::resolve('Kampala', 'Kololo');

        $this->assertTrue($known['found']);
        $this->assertEqualsWithDelta(0.332, $known['latitude'], 0.001);
        Http::assertNothingSent();

        $missing = Places::resolve('Kampala', 'Kitooro Landing');

        $this->assertFalse($missing['found']);
        Http::assertSentCount(1);
    }

    public function test_search_asks_for_a_pin_only_when_a_place_cannot_be_found(): void
    {
        Http::fake();

        Livewire::test(CapsuleSearch::class)
            ->set('location', 'Kololo, Kampala')
            ->call('search')
            ->assertSet('needsPin', false)
            ->assertDontSee('Add a location pin');

        Livewire::test(CapsuleSearch::class)
            ->set('location', 'Kitooro Landing, Kampala')
            ->call('search')
            ->assertSet('needsPin', true)
            ->assertSee('Add a location pin')
            ->assertDontSee('name="latitude"');
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

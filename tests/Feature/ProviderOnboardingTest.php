<?php

namespace Tests\Feature;

use App\Models\Escort;
use App\Models\EscortReference;
use App\Models\User;
use App\Support\HomeServiceCatalog;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProviderOnboardingTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_saving_personal_details_opens_the_services_step(): void
    {
        $specialist = User::factory()->create(['account_kind' => 'specialist']);
        $specialist->assignRole('provider_free');

        $this->actingAs($specialist)
            ->post(route('provider.onboard.store'), $this->about())
            ->assertRedirect(route('provider.onboard'));

        $profile = $specialist->escorts()->first();
        $this->assertSame('work', $profile->onboarding_step);
        $this->assertSame('Amina Chef', $profile->title);
        $this->assertSame(['English', 'Luganda'], $profile->spokenLanguages());
        $this->assertSame('Kololo', $profile->neighborhood);
        $this->assertArrayNotHasKey('date_of_birth', $profile->getAttributes());
    }

    public function test_a_short_bio_stays_on_personal_and_shows_the_error(): void
    {
        $specialist = User::factory()->create(['account_kind' => 'specialist']);
        $specialist->assignRole('provider_free');

        $this->actingAs($specialist)
            ->from(route('provider.onboard'))
            ->post(route('provider.onboard.store'), $this->about(['bio' => 'Too short']))
            ->assertRedirect(route('provider.onboard'))
            ->assertSessionHasErrors('bio');

        $this->assertSame('about', $specialist->escorts()->first()->onboarding_step);
    }

    public function test_selected_services_are_saved_with_a_price(): void
    {
        $specialist = User::factory()->create(['account_kind' => 'specialist']);
        $specialist->assignRole('provider_free');

        $this->actingAs($specialist)->post(route('provider.onboard.store'), $this->about());

        $this->actingAs($specialist)
            ->post(route('provider.onboard.store'), [
                'service_type' => 'private_chef',
                'offerings' => [
                    'breakfast-preparation' => [
                        'selected' => '1',
                        'price' => 50000,
                        'unit' => 'session',
                        'location' => 'client_home',
                        'turnaround' => 'Morning',
                    ],
                ],
            ])
            ->assertRedirect(route('provider.onboard'));

        $profile = $specialist->escorts()->first();
        $this->assertSame('experience', $profile->onboarding_step);
        $this->assertSame('Private chef', $profile->occupation);
        $this->assertSame('Breakfast preparation', $profile->offerings()->first()->name);
        $this->assertSame(50000, $profile->offerings()->first()->price);
    }

    public function test_service_catalog_keys_are_unique(): void
    {
        foreach (array_keys(HomeServiceCatalog::OCCUPATIONS) as $occupation) {
            $keys = array_column(HomeServiceCatalog::items($occupation), 'key');

            $this->assertSame(array_values(array_unique($keys)), array_values($keys), $occupation);
        }
    }

    public function test_a_reference_can_confirm_the_provider(): void
    {
        $specialist = User::factory()->create(['account_kind' => 'specialist']);
        $profile = Escort::create([
            'user_id' => $specialist->id,
            'title' => 'Amina Chef',
            'slug' => 'amina-chef',
            'description' => 'Private chef for family meals and small dinners.',
            'tier' => 'premium',
            'category' => 'service',
            'kind' => 'service',
            'neighborhood' => 'Kololo',
            'city' => 'Kampala',
            'monthly_price' => 50000,
            'whatsapp_number' => '700111222',
        ]);
        $reference = $profile->references()->create([
            'name' => 'Sarah',
            'phone' => '0772000111',
            'relationship' => 'previous_customer',
        ]);

        $this->post(route('references.confirm.store', $reference->verification_token), ['answer' => 'yes'])
            ->assertRedirect(route('references.confirm', $reference->verification_token));

        $this->assertSame(EscortReference::CONFIRMED, $reference->fresh()->status);
    }

    /**
     * @param  array<string, mixed>  $overrides
     * @return array<string, mixed>
     */
    private function about(array $overrides = []): array
    {
        return array_merge([
            'display_name' => 'Amina Chef',
            'phone' => '256700111222',
            'nationality' => 'Uganda',
            'languages' => ['English', 'Luganda'],
            'city' => 'Kampala',
            'neighborhood' => 'Kololo',
            'whatsapp_code' => '+256',
            'whatsapp_number' => '700111222',
            'bio' => 'Private chef with seven years cooking family dinners and events.',
        ], $overrides);
    }
}

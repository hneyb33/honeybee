<?php

namespace Tests\Feature;

use App\Models\User;
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
            ->post(route('provider.onboard.store'), [
                'display_name' => 'Amina Chef',
                'legal_name' => 'Amina Nakato',
                'date_of_birth' => '1994-04-12',
                'phone' => '256700111222',
                'nationality' => 'Ugandan',
                'languages' => 'English, Luganda',
                'bio' => 'Private chef with seven years cooking family dinners and events.',
            ])
            ->assertRedirect(route('provider.onboard'));

        $profile = $specialist->escorts()->first();
        $this->assertSame('services', $profile->onboarding_step);
        $this->assertSame('Amina Chef', $profile->title);
        $this->assertArrayNotHasKey('date_of_birth', $profile->getAttributes());
    }

    public function test_a_short_bio_stays_on_personal_and_shows_the_error(): void
    {
        $specialist = User::factory()->create(['account_kind' => 'specialist']);
        $specialist->assignRole('provider_free');

        $this->actingAs($specialist)
            ->from(route('provider.onboard'))
            ->post(route('provider.onboard.store'), [
                'display_name' => 'Amina Chef',
                'legal_name' => 'Amina Nakato',
                'date_of_birth' => '1994-04-12',
                'phone' => '256700111222',
                'nationality' => 'Ugandan',
                'languages' => 'English',
                'bio' => 'Too short',
            ])
            ->assertRedirect(route('provider.onboard'))
            ->assertSessionHasErrors('bio');

        $this->assertSame('personal', $specialist->escorts()->first()->onboarding_step);
    }
}

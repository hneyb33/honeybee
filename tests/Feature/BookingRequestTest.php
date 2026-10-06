<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Escort;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class BookingRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_contacting_a_profile_is_logged_with_a_channel_flag(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $specialist = User::factory()->create();
        $specialist->assignRole('provider_free');
        $specialist->activatePlan(\App\Models\Subscription::PLAN_SPECIALIST);

        $escort = Escort::create([
            'user_id' => $specialist->id,
            'title' => 'Amina',
            'slug' => 'amina',
            'description' => str_repeat('Discreet specialist profile. ', 4),
            'tier' => 'premium',
            'kind' => 'escort',
            'escort_tier' => 'premium',
            'category' => 'escort',
            'status' => 'active',
            'verification_status' => 'verified',
            'neighborhood' => 'Kololo',
            'city' => 'Kampala',
            'monthly_price' => 150000,
            'hourly_rate' => 150000,
            'whatsapp_number' => '256700000000',
            'telegram' => 'amina_honeybee',
        ]);

        $client = User::factory()->create(['account_kind' => 'client']);
        $client->assignRole('client_free');

        $this->withSession(['allowed_age' => true])
            ->actingAs($client)
            ->get(route('escorts.contact', [$escort, 'whatsapp']))
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'client_id' => $client->id,
            'escort_id' => $escort->id,
            'channel' => Booking::CHANNEL_WHATSAPP,
            'status' => Booking::CONTACTED,
        ]);

        $this->withSession(['allowed_age' => true])
            ->actingAs($client)
            ->get(route('escorts.contact', [$escort, 'telegram']))
            ->assertRedirect();

        $this->assertDatabaseHas('bookings', [
            'client_id' => $client->id,
            'escort_id' => $escort->id,
            'channel' => Booking::CHANNEL_TELEGRAM,
            'status' => Booking::CONTACTED,
        ]);

        $this->withSession(['allowed_age' => true])
            ->get(route('escorts.contact', [$escort, 'whatsapp']))
            ->assertRedirect(route('login'));
    }
}

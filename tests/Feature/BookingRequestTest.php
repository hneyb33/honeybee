<?php

namespace Tests\Feature;

use App\Models\Booking;
use App\Models\Escort;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class BookingRequestTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_client_request_is_stored_for_the_specialist(): void
    {
        $this->seed(RolesAndPermissionsSeeder::class);

        $specialist = User::factory()->create();
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
        ]);

        $client = User::factory()->create();
        $client->assignRole('client_free');

        Livewire::actingAs($client)
            ->test(\App\Livewire\Escort\BookingDock::class, ['escort' => $escort])
            ->set('appointmentDate', now()->addDays(3)->toDateString())
            ->set('duration', '1')
            ->call('requestBooking')
            ->assertSet('requested', true);

        $this->assertDatabaseHas('bookings', [
            'client_id' => $client->id,
            'escort_id' => $escort->id,
            'status' => Booking::REQUESTED,
        ]);
    }
}

<?php

namespace Tests\Feature;

use App\Models\Escort;
use App\Models\Review;
use App\Models\Subscription;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileReviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_a_client_can_rate_a_profile_and_see_it_on_the_page(): void
    {
        $owner = User::factory()->create(['account_kind' => 'model']);
        $owner->assignRole('provider_free');
        $owner->activatePlan(Subscription::PLAN_ESCORT_PREMIUM);

        $escort = Escort::create([
            'user_id' => $owner->id,
            'title' => 'Amina Review',
            'slug' => 'amina-review',
            'description' => str_repeat('A longer profile description for the read more control. ', 12),
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
            'telegram' => 'amina',
            'verification_status' => 'verified',
            'sexual_orientation' => 'straight',
        ]);

        $client = User::factory()->create(['account_kind' => 'client', 'name' => 'Reviewer']);
        $client->assignRole('client_free');

        $this->withSession(['allowed_age' => true])
            ->actingAs($client)
            ->get(route('escort.show', $escort))
            ->assertOk()
            ->assertSee('Read more')
            ->assertSee('Write a review')
            ->assertSee('Chat')
            ->assertSee('UGX 150,000');

        $this->actingAs($client)
            ->get(route('escorts.review', $escort))
            ->assertOk()
            ->assertSee('Review Amina Review');

        $this->actingAs($client)
            ->post(route('escorts.review.store', $escort), [
                'rating' => 5,
                'body' => 'Calm and professional.',
            ])
            ->assertRedirect(route('escort.show', $escort));

        $this->assertDatabaseHas('reviews', [
            'client_id' => $client->id,
            'escort_id' => $escort->id,
            'rating' => 5,
            'body' => 'Calm and professional.',
        ]);

        $escort->refresh();
        $this->assertSame(1, $escort->review_count);
        $this->assertEquals(5, (float) $escort->rating);

        $this->actingAs($client)
            ->get(route('escort.show', $escort))
            ->assertSee('Calm and professional.')
            ->assertSee('Reviewer');

        $this->actingAs($client)
            ->post(route('escorts.review.store', $escort), [
                'rating' => 4,
                'body' => 'Updated note.',
            ]);

        $this->assertSame(1, Review::query()->count());
        $this->assertSame(4, Review::query()->first()->rating);
    }
}

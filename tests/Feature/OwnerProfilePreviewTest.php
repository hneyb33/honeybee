<?php

namespace Tests\Feature;

use App\Models\Escort;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OwnerProfilePreviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
    }

    public function test_a_signed_in_provider_sees_the_public_profile_and_uploaded_media(): void
    {
        $owner = User::factory()->create(['account_kind' => 'model']);
        $owner->assignRole('provider_free');

        $escort = Escort::create([
            'user_id' => $owner->id,
            'title' => 'Amina Preview',
            'slug' => 'amina-preview',
            'description' => 'Profile shown to the signed-in provider.',
            'tier' => 'premium',
            'kind' => 'escort',
            'escort_tier' => 'premium',
            'category' => 'escort',
            'status' => 'pending',
            'neighborhood' => 'Kololo',
            'city' => 'Kampala',
            'monthly_price' => 150000,
            'hourly_rate' => 150000,
            'whatsapp_number' => '256700000000',
            'verification_status' => 'pending',
        ]);
        $escort->media()->create([
            'path' => 'profiles/'.$escort->id.'/face.jpg',
            'kind' => 'image',
            'sort_order' => 1,
        ]);
        $escort->media()->create([
            'path' => 'profiles/'.$escort->id.'/intro.mp4',
            'kind' => 'video',
            'sort_order' => 2,
        ]);

        $this->actingAs($owner)
            ->get(route('dashboard'))
            ->assertOk()
            ->assertSee('This is how your profile appears')
            ->assertSee('Amina Preview')
            ->assertSee('About')
            ->assertSee('View my profile', false);

        $this->withSession(['allowed_age' => true])
            ->actingAs($owner)
            ->get(route('escort.show', $escort))
            ->assertOk()
            ->assertSee('This is how your profile appears')
            ->assertSee('Amina Preview');

        $this->actingAs($owner)
            ->get(route('owner.escorts.edit', $escort))
            ->assertOk()
            ->assertSee('Photos and videos already added')
            ->assertSee('data-profile-masonry', false)
            ->assertSee('data-verification-media="photo"', false)
            ->assertSee('data-verification-media="video"', false);
    }
}

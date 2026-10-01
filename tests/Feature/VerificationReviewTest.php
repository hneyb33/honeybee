<?php

namespace Tests\Feature;

use App\Filament\Resources\EscortResource;
use App\Filament\Resources\EscortResource\Pages\ListEscorts;
use App\Models\Escort;
use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Filament\Facades\Filament;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Livewire\Livewire;
use Tests\TestCase;

class VerificationReviewTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(RolesAndPermissionsSeeder::class);
        Filament::setCurrentPanel(Filament::getPanel('admin'));
    }

    public function test_age_check_uses_explicit_dark_mode_colors(): void
    {
        $this->get(route('age-check'))
            ->assertOk()
            ->assertSee('age-gate', false)
            ->assertSee('age-gate-yes', false)
            ->assertSee('age-gate-no', false)
            ->assertSee('You must be 18 or older to continue');
    }

    public function test_admin_can_see_submitted_photos_and_videos_and_approve(): void
    {
        $admin = User::factory()->create();
        $admin->assignRole('super_admin');

        $owner = User::factory()->create(['account_kind' => 'model']);
        $escort = Escort::create([
            'user_id' => $owner->id,
            'title' => 'Amina',
            'slug' => 'amina-review',
            'description' => 'Profile waiting for verification.',
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

        $this->actingAs($admin, 'admin')
            ->get(EscortResource::getUrl('edit', ['record' => $escort]))
            ->assertOk()
            ->assertSee('Submitted photos and videos')
            ->assertSee('data-verification-media="photo"', false)
            ->assertSee('data-verification-media="video"', false)
            ->assertSee('intro.mp4', false);

        Livewire::actingAs($admin, 'admin')
            ->test(ListEscorts::class)
            ->assertSee('1 photos, 1 video')
            ->mountTableAction('reviewMedia', $escort)
            ->assertMountedActionModalSee('data-verification-media="photo"', false)
            ->assertMountedActionModalSee('data-verification-media="video"', false)
            ->mountTableAction('approveProfile');

        $escort->refresh();
        $this->assertSame('verified', $escort->verification_status);
        $this->assertSame('published', $escort->status);
    }
}

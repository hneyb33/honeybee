<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Escort;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\View\View;

class ProviderOnboardingController extends Controller
{
    public const STEPS = [
        'personal',
        'services',
        'location',
        'experience',
        'portfolio',
        'references',
        'availability',
        'verification',
        'payment',
        'review',
    ];

    public function show(Request $request): View|RedirectResponse
    {
        abort_unless($request->user()->isHomeSpecialist(), 403);

        $profile = $this->draft($request);
        if ($profile->onboarding_step === 'complete') {
            return redirect()->route('owner.escorts.index');
        }

        return view('pages.owner.onboarding', [
            'profile' => $this->draft($request),
            'steps' => self::STEPS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->isHomeSpecialist(), 403);

        $profile = $this->draft($request);
        $step = $profile->onboarding_step ?: 'personal';
        $data = $profile->onboarding_data ?? [];
        $data[$step] = $this->validateStep($request, $step);
        $index = array_search($step, self::STEPS, true);
        $next = self::STEPS[min($index + 1, count(self::STEPS) - 1)];

        $profile->onboarding_data = $data;
        $profile->onboarding_step = $request->boolean('finish') ? 'complete' : $next;
        $this->applyPublicFields($profile, $data);

        if ($request->boolean('finish')) {
            $profile->verification_status = 'pending';
            $profile->status = 'pending';
        }

        $profile->save();
        $this->storePhotos($request, $profile);

        if ($request->boolean('finish')) {
            return redirect()
                ->route('owner.escorts.index')
                ->with('status', 'Profile submitted. An admin verifies identity before it can be listed.');
        }

        return redirect()
            ->route('provider.onboard')
            ->with('status', 'Saved. Continue with '.str_replace('_', ' ', $next).'.');
    }

    private function draft(Request $request): Escort
    {
        return Escort::query()->firstOrCreate(
            ['user_id' => $request->user()->id, 'kind' => Escort::KIND_SERVICE],
            [
                'title' => $request->user()->name,
                'slug' => Str::slug($request->user()->name).'-'.$request->user()->id,
                'description' => 'Draft home-service profile.',
                'tier' => 'premium',
                'category' => 'service',
                'status' => 'draft',
                'verification_status' => 'pending',
                'neighborhood' => 'Kampala',
                'city' => 'Kampala',
                'monthly_price' => 50000,
                'hourly_rate' => 50000,
                'whatsapp_number' => '256700000000',
                'onboarding_step' => 'personal',
            ],
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function validateStep(Request $request, string $step): array
    {
        return match ($step) {
            'personal' => $request->validate([
                'display_name' => ['required', 'string', 'max:120'],
                'gender' => ['nullable', 'in:female,male'],
                'phone' => ['required', 'string', 'max:40'],
                'nationality' => ['required', 'string', 'max:80'],
                'languages' => ['required', 'string', 'max:200'],
                'legal_name' => ['required', 'string', 'max:160'],
                'date_of_birth' => ['required', 'date', 'before:-18 years'],
                'alt_phone' => ['nullable', 'string', 'max:40'],
                'bio' => ['required', 'string', 'min:20', 'max:2500'],
            ]),
            'services' => $request->validate([
                'occupation' => ['required', 'string', 'max:120'],
                'service_type' => ['required', 'in:'.implode(',', array_keys(\App\Models\Escort::homeServices()))],
                'service_names' => ['required', 'string', 'max:500'],
                'hourly_rate' => ['required', 'integer', 'min:1000'],
                'pricing_model' => ['required', 'in:hourly,daily,fixed,quote'],
                'emergency' => ['nullable', 'boolean'],
                'equipment' => ['nullable', 'string', 'max:500'],
            ]),
            'location' => $request->validate([
                'district' => ['required', 'string', 'max:80'],
                'city' => ['required', 'string', 'max:80'],
                'division' => ['nullable', 'string', 'max:80'],
                'parish' => ['nullable', 'string', 'max:80'],
                'village' => ['nullable', 'string', 'max:80'],
                'landmark' => ['required', 'string', 'max:120'],
                'areas' => ['required', 'string', 'max:300'],
                'travel_km' => ['required', 'in:5,10,20,50,anywhere'],
            ]),
            'experience' => $request->validate([
                'years' => ['required', 'integer', 'min:0', 'max:60'],
                'summary' => ['required', 'string', 'min:20', 'max:2000'],
                'qualifications' => ['nullable', 'string', 'max:500'],
            ]),
            'portfolio' => $request->validate([
                'photos' => ['required', 'array', 'min:1', 'max:8'],
                'photos.*' => ['file', 'max:20480'],
                'portfolio_title' => ['required', 'string', 'max:120'],
                'portfolio_description' => ['nullable', 'string', 'max:500'],
                'portfolio_location' => ['nullable', 'string', 'max:120'],
            ]),
            'references' => $request->validate([
                'referee_name' => ['nullable', 'string', 'max:120'],
                'referee_relationship' => ['nullable', 'string', 'max:80'],
                'referee_phone' => ['nullable', 'string', 'max:40'],
                'referee_organisation' => ['nullable', 'string', 'max:120'],
            ]),
            'availability' => $request->validate([
                'status' => ['required', 'in:available,busy,offline'],
                'notes' => ['nullable', 'string', 'max:500'],
                'same_day' => ['nullable', 'boolean'],
                'recurring' => ['nullable', 'boolean'],
            ]),
            default => [],
        };
    }

    /**
     * @param  array<string, array<string, mixed>>  $data
     */
    private function applyPublicFields(Escort $profile, array $data): void
    {
        $personal = $data['personal'] ?? [];
        $services = $data['services'] ?? [];
        $location = $data['location'] ?? [];

        if ($personal) {
            $profile->title = $personal['display_name'];
            $profile->description = $personal['bio'];
            $profile->about_me = $personal['bio'];
            $profile->phone = $personal['phone'];
            $profile->whatsapp_number = $personal['phone'];
            $profile->nationality = $personal['nationality'] ?? $profile->nationality;
            if (! empty($personal['gender'])) {
                $profile->gender = $personal['gender'];
            }
        }

        if ($services) {
            $profile->occupation = $services['occupation'];
            $profile->service_type = $services['service_type'];
            $profile->hourly_rate = (int) $services['hourly_rate'];
            $profile->monthly_price = (int) $services['hourly_rate'];
            $profile->services_offered = array_values(array_filter(array_map('trim', preg_split('/\r\n|\r|\n/', $services['service_names']) ?: [])));
        }

        if ($location) {
            $profile->city = $location['city'];
            $profile->neighborhood = $location['landmark'];
            $profile->summary_line = ($profile->serviceLabel() ?: 'Home service').' near '.$location['landmark'];
        }
    }

    private function storePhotos(Request $request, Escort $profile): void
    {
        if (! $request->hasFile('photos')) {
            return;
        }

        foreach ($request->file('photos') as $index => $file) {
            $path = $file->store('profiles/'.$profile->id, 'public');
            $profile->media()->create([
                'path' => $path,
                'kind' => str_starts_with((string) $file->getMimeType(), 'video') ? 'video' : 'image',
                'sort_order' => $index,
            ]);

            if ($index === 0) {
                $profile->update(['cover_image' => \Illuminate\Support\Facades\Storage::disk('public')->url($path)]);
            }
        }
    }
}

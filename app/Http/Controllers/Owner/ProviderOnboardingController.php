<?php

namespace App\Http\Controllers\Owner;

use App\Http\Controllers\Controller;
use App\Models\Escort;
use App\Support\ProviderProfile;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\View\View;

class ProviderOnboardingController extends Controller
{
    public const STEPS = [
        'about',
        'work',
        'experience',
        'trust',
        'finish',
    ];

    public function show(Request $request): View|RedirectResponse
    {
        abort_unless($request->user()->isHomeSpecialist(), 403);

        $profile = $this->draft($request);

        if ($profile->onboarding_step === 'complete') {
            return redirect()->route('owner.escorts.index');
        }

        $this->normalize($profile);
        $profile->load('offerings', 'references', 'media');

        return view('pages.owner.onboarding', [
            'profile' => $profile,
            'steps' => self::STEPS,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        abort_unless($request->user()->isHomeSpecialist(), 403);

        $profile = $this->draft($request);
        $step = $this->normalize($profile);

        if ($request->boolean('back')) {
            $index = array_search($step, self::STEPS, true);
            $profile->onboarding_step = self::STEPS[max(0, (int) $index - 1)];
            $profile->save();

            return redirect()->route('provider.onboard');
        }

        $validated = match ($step) {
            'about' => ProviderProfile::validateAbout($request),
            'work' => ProviderProfile::validateWork($request),
            'experience' => ProviderProfile::validateExperience($request),
            'trust' => ProviderProfile::validateTrust($request, $profile),
            'finish' => ProviderProfile::validateFinish($request, $profile),
            default => [],
        };

        match ($step) {
            'about' => ProviderProfile::applyAbout($profile, $validated),
            'work' => ProviderProfile::applyWork($profile, $validated),
            'experience' => ProviderProfile::applyExperience($profile, $validated),
            'trust' => ProviderProfile::applyTrust($profile, $validated, $request),
            'finish' => $profile->weekly_hours = $validated['hours'],
            default => null,
        };

        if ($step === 'finish') {
            ProviderProfile::storePhotos($request, $profile);
        }

        $stored = match ($step) {
            'work' => collect($validated)->except('offering_rows')->all(),
            'trust' => collect($validated)->except('certificate')->all(),
            'finish' => ['hours' => $validated['hours']],
            default => $validated,
        };

        $data = $profile->onboarding_data ?? [];
        $data[$step] = $stored;
        $index = array_search($step, self::STEPS, true);
        $next = self::STEPS[min((int) $index + 1, count(self::STEPS) - 1)];
        $profile->onboarding_data = $data;

        if ($request->boolean('finish')) {
            if ($profile->offerings()->doesntExist() || blank($profile->experience_band)) {
                $profile->onboarding_step = $profile->offerings()->doesntExist() ? 'work' : 'experience';
                $profile->save();

                return redirect()
                    ->route('provider.onboard')
                    ->withErrors(['offerings' => 'Add your services and experience before you finish.']);
            }

            $profile->onboarding_step = 'complete';
            $profile->verification_status = 'pending';
            $profile->status = 'pending';
            $profile->save();

            return redirect()
                ->route('owner.escorts.index')
                ->with('status', 'Profile submitted. An admin verifies it before it can be listed.');
        }

        $profile->onboarding_step = $next;
        $profile->save();

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
                'whatsapp_code' => '+256',
                'telegram_code' => '+256',
                'gender' => '',
                'onboarding_step' => 'about',
            ],
        );
    }

    private function normalize(Escort $profile): string
    {
        $step = match ($profile->onboarding_step) {
            'about', 'work', 'experience', 'trust', 'finish', 'complete' => $profile->onboarding_step,
            'services' => 'work',
            'references', 'verification' => 'trust',
            'portfolio', 'availability', 'payment', 'review' => 'finish',
            default => 'about',
        };

        if ($step !== 'complete' && $profile->onboarding_step !== $step) {
            $profile->onboarding_step = $step;
            $profile->save();
        }

        return $step;
    }
}

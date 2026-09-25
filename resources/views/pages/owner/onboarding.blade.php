<x-layouts.app title="Provider onboarding - Honeybee">
    @php
        $step = $profile->onboarding_step ?: 'personal';
        $saved = $profile->onboarding_data[$step] ?? [];
        $labels = [
            'personal' => 'Personal details',
            'services' => 'Services',
            'location' => 'Location',
            'experience' => 'Experience',
            'portfolio' => 'Portfolio',
            'references' => 'References',
            'availability' => 'Availability',
            'verification' => 'Verification',
            'payment' => 'Payment',
            'review' => 'Review',
        ];
    @endphp
    <section class="mx-auto max-w-2xl px-6 py-10">
        <p class="text-xs font-semibold uppercase tracking-wide text-neutral-500">Specialist onboarding</p>
        <h1 class="mt-2 text-3xl font-semibold text-neutral-900">{{ $labels[$step] ?? 'Onboarding' }}</h1>
        <p class="mt-2 text-sm text-neutral-500">You can leave and come back. Progress stays on this account.</p>
        <ol class="mt-4 flex flex-wrap gap-2 text-xs text-neutral-500">
            @foreach ($steps as $name)
                <li class="{{ $name === $step ? 'font-semibold text-neutral-900' : '' }}">{{ $labels[$name] }}</li>
            @endforeach
        </ol>
        @if (session('status'))
            <p class="mt-4 rounded-lg bg-neutral-100 px-4 py-3 text-sm">{{ session('status') }}</p>
        @endif
        @if ($errors->any())
            <div class="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                <p class="font-semibold">Save did not continue. Fix these fields:</p>
                <ul class="mt-2 list-disc pl-5">
                    @foreach ($errors->all() as $error)
                        <li>{{ $error }}</li>
                    @endforeach
                </ul>
            </div>
        @endif

        <form method="POST" action="{{ route('provider.onboard.store') }}" enctype="multipart/form-data" class="mt-8 space-y-4">
            @csrf
            @if ($step === 'personal')
                <label class="block text-sm">Full legal name<input name="legal_name" value="{{ old('legal_name', $saved['legal_name'] ?? '') }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <p class="text-xs text-neutral-500">Legal name and date of birth stay private. They are not shown on the public profile.</p>
                <label class="block text-sm">Display name<input name="display_name" value="{{ old('display_name', $saved['display_name'] ?? $profile->title) }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Date of birth<input name="date_of_birth" type="date" value="{{ old('date_of_birth', $saved['date_of_birth'] ?? '') }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Gender
                    <select name="gender" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2">
                        <option value="">Prefer not to say</option>
                        <option value="female" @selected(old('gender', $saved['gender'] ?? '') === 'female')>Female</option>
                        <option value="male" @selected(old('gender', $saved['gender'] ?? '') === 'male')>Male</option>
                    </select>
                </label>
                <label class="block text-sm">Mobile<input name="phone" value="{{ old('phone', $saved['phone'] ?? '') }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Alternative phone<input name="alt_phone" value="{{ old('alt_phone', $saved['alt_phone'] ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Nationality<input name="nationality" value="{{ old('nationality', $saved['nationality'] ?? '') }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Languages<input name="languages" value="{{ old('languages', $saved['languages'] ?? '') }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Short professional bio<textarea name="bio" rows="5" required minlength="20" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2">{{ old('bio', $saved['bio'] ?? '') }}</textarea></label>
                <p class="text-xs text-neutral-500">At least 20 characters. Example: professional chef with 7 years cooking for family dinners and events.</p>
            @elseif ($step === 'services')
                <label class="block text-sm">Occupation<input name="occupation" value="{{ old('occupation', $saved['occupation'] ?? '') }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2" placeholder="Private chef"></label>
                <label class="block text-sm">Category
                    <select name="service_type" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2">
                        @foreach (\App\Models\Escort::homeServices() as $value => $label)
                            <option value="{{ $value }}" @selected(old('service_type', $saved['service_type'] ?? '') === $value)>{{ $label }}</option>
                        @endforeach
                    </select>
                </label>
                <label class="block text-sm">Services, one per line<textarea name="service_names" rows="4" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2" placeholder="Birthday dinner&#10;Family meals">{{ old('service_names', $saved['service_names'] ?? '') }}</textarea></label>
                <label class="block text-sm">Pricing
                    <select name="pricing_model" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2">
                        @foreach (['hourly' => 'Hourly', 'daily' => 'Daily', 'fixed' => 'Fixed price', 'quote' => 'Quote required'] as $value => $label)
                            <option value="{{ $value }}" @selected(old('pricing_model', $saved['pricing_model'] ?? 'hourly') === $value)>{{ $label }}</option>
                        @endforeach
                    </select>
                </label>
                <label class="block text-sm">Starting price (UGX)<input name="hourly_rate" type="number" min="1000" value="{{ old('hourly_rate', $saved['hourly_rate'] ?? '') }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="emergency" value="1" @checked(old('emergency', $saved['emergency'] ?? false))> Available for emergency calls</label>
                <label class="block text-sm">Equipment or tools<textarea name="equipment" rows="3" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2">{{ old('equipment', $saved['equipment'] ?? '') }}</textarea></label>
            @elseif ($step === 'location')
                <label class="block text-sm">District<input name="district" value="{{ old('district', $saved['district'] ?? '') }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">City<input name="city" value="{{ old('city', $saved['city'] ?? 'Kampala') }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Division or sub-county<input name="division" value="{{ old('division', $saved['division'] ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Parish<input name="parish" value="{{ old('parish', $saved['parish'] ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Village or zone<input name="village" value="{{ old('village', $saved['village'] ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Nearby landmark<input name="landmark" value="{{ old('landmark', $saved['landmark'] ?? '') }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Areas you cover<input name="areas" value="{{ old('areas', $saved['areas'] ?? '') }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2" placeholder="Kira, Ntinda, Bukoto"></label>
                <label class="block text-sm">Maximum travel
                    <select name="travel_km" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2">
                        @foreach (['5' => '5 km', '10' => '10 km', '20' => '20 km', '50' => '50 km', 'anywhere' => 'Anywhere'] as $value => $label)
                            <option value="{{ $value }}" @selected(old('travel_km', $saved['travel_km'] ?? '10') === $value)>{{ $label }}</option>
                        @endforeach
                    </select>
                </label>
            @elseif ($step === 'experience')
                <label class="block text-sm">Years of experience<input name="years" type="number" min="0" value="{{ old('years', $saved['years'] ?? '') }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">What you have done<textarea name="summary" rows="4" required minlength="20" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2">{{ old('summary', $saved['summary'] ?? '') }}</textarea></label>
                <label class="block text-sm">Qualifications, if any<textarea name="qualifications" rows="3" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2">{{ old('qualifications', $saved['qualifications'] ?? '') }}</textarea></label>
            @elseif ($step === 'portfolio')
                <p class="text-sm text-neutral-600">Upload photos or videos of finished work. A chef can show meals. Laundry can show before and after.</p>
                <label class="block text-sm">Title<input name="portfolio_title" value="{{ old('portfolio_title', $saved['portfolio_title'] ?? '') }}" required class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Description<textarea name="portfolio_description" rows="3" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2">{{ old('portfolio_description', $saved['portfolio_description'] ?? '') }}</textarea></label>
                <label class="block text-sm">Location, optional<input name="portfolio_location" value="{{ old('portfolio_location', $saved['portfolio_location'] ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <input type="file" name="photos[]" multiple accept="image/*,video/*" required class="w-full text-sm">
                @error('photos') <p class="text-xs text-red-600">{{ $message }}</p> @enderror
            @elseif ($step === 'references')
                <p class="text-sm text-neutral-600">A reference helps admin review. The referee is not published on your profile. You can leave this blank and continue.</p>
                <label class="block text-sm">Referee name<input name="referee_name" value="{{ old('referee_name', $saved['referee_name'] ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Relationship<input name="referee_relationship" value="{{ old('referee_relationship', $saved['referee_relationship'] ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Phone<input name="referee_phone" value="{{ old('referee_phone', $saved['referee_phone'] ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
                <label class="block text-sm">Organisation<input name="referee_organisation" value="{{ old('referee_organisation', $saved['referee_organisation'] ?? '') }}" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2"></label>
            @elseif ($step === 'availability')
                <label class="block text-sm">Current status
                    <select name="status" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2">
                        <option value="available">Available</option>
                        <option value="busy">Busy</option>
                        <option value="offline">Offline</option>
                    </select>
                </label>
                <label class="block text-sm">Weekly hours<textarea name="notes" rows="4" class="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2" placeholder="Mon–Fri 08:00–18:00. Saturday 09:00–16:00. Sunday emergency only.">{{ old('notes', $saved['notes'] ?? '') }}</textarea></label>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="same_day" value="1" @checked(old('same_day', $saved['same_day'] ?? false))> Same-day jobs</label>
                <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="recurring" value="1" @checked(old('recurring', $saved['recurring'] ?? false))> Recurring jobs</label>
            @elseif ($step === 'verification')
                <p class="text-sm leading-6 text-neutral-700">Identity is checked by an admin before the profile is verified. Date of birth and ID documents are not shown on the public page. Continue to save this step.</p>
            @elseif ($step === 'payment')
                <p class="text-sm leading-6 text-neutral-700">A specialist subscription is required before a verified profile is listed. You can activate it from the dashboard after this wizard. Payment collection comes later.</p>
            @else
                <p class="text-sm leading-6 text-neutral-700">{{ $profile->title }} · {{ $profile->serviceLabel() ?: 'Home service' }} · {{ $profile->neighborhood }}, {{ $profile->city }}. Submit sends the profile for admin review. It stays hidden until verification and an active subscription.</p>
                <button name="finish" value="1" class="rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">Submit for review</button>
            @endif
            @if ($step !== 'review')
                <button class="rounded-lg bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">Save and continue</button>
            @endif
        </form>
    </section>
</x-layouts.app>

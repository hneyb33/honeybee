@php
    $profile = $profile ?? $escort ?? null;
    $saved = is_array($saved ?? null) ? $saved : [];
    $gender = old('gender', $saved['gender'] ?? $profile->gender) ?? '';
    $selectedLanguages = old('languages', $saved['languages'] ?? $profile->spokenLanguages());
    if (is_string($selectedLanguages)) {
        $selectedLanguages = array_values(array_filter(array_map('trim', explode(',', $selectedLanguages))));
    }
@endphp

<label class="block text-sm">
    <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Display name</span>
    <input name="display_name" value="{{ old('display_name', $saved['display_name'] ?? $profile->title) }}" required class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm">
    @error('display_name') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
</label>

<fieldset>
    <legend class="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-500">Gender, if you want to say</legend>
    <div class="grid gap-2 sm:grid-cols-3">
        @foreach (['' => 'Prefer not to say', 'female' => 'Female', 'male' => 'Male'] as $value => $label)
            <label class="flex cursor-pointer items-center justify-center rounded-xl border border-neutral-300 px-3 py-3 text-sm has-[:checked]:border-[#0f0a0a] has-[:checked]:bg-[#f4f5f6]">
                <input type="radio" name="gender" value="{{ $value }}" class="sr-only" @checked($gender === $value)>
                {{ $label }}
            </label>
        @endforeach
    </div>
</fieldset>

<label class="block text-sm">
    <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Nationality</span>
    <select name="nationality" required class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm">
        @foreach (\App\Models\Escort::NATIONALITIES as $nationality)
            <option value="{{ $nationality }}" @selected(old('nationality', $saved['nationality'] ?? $profile->nationality) === $nationality)>{{ $nationality }}</option>
        @endforeach
    </select>
    @error('nationality') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
</label>

<label class="block text-sm">
    <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Languages</span>
    <select name="languages[]" multiple required class="min-h-36 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm">
        @foreach (\App\Models\Escort::LANGUAGES as $language)
            <option value="{{ $language }}" @selected(in_array($language, $selectedLanguages, true))>{{ $language }}</option>
        @endforeach
    </select>
    @error('languages') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
</label>

@include('pages.owner.partials.location-fields', ['escort' => $profile])

<label class="block text-sm">
    <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">How far you travel</span>
    <select name="travel_km" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm">
        @foreach (['5' => '5 km', '10' => '10 km', '20' => '20 km', '50' => '50 km', 'anywhere' => 'Anywhere'] as $value => $label)
            <option value="{{ $value }}" @selected(old('travel_km', $saved['travel_km'] ?? $profile->travel_km ?? '10') === $value)>{{ $label }}</option>
        @endforeach
    </select>
</label>

@include('pages.owner.partials.contact-fields', ['escort' => $profile])

<label class="block text-sm">
    <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Short introduction</span>
    <textarea name="bio" rows="5" required minlength="20" class="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm">{{ old('bio', $saved['bio'] ?? ($profile->description !== 'Draft home-service profile.' ? $profile->description : '')) }}</textarea>
    <span class="mt-2 block text-xs text-neutral-500">At least 20 characters. Example: I cook family meals and small dinners in Kampala.</span>
    @error('bio') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
</label>

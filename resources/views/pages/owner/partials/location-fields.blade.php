@php
    $locationMap = \App\Support\UgandaLocations::searchableMap();
    $profile = $escort ?? null;
    $selectedCity = old('city', $profile->city ?? 'Kampala');
    $selectedArea = old('neighborhood', $profile->neighborhood ?? '');
    $areaSuggestions = collect($locationMap)->flatten()->unique()->sort()->values();
@endphp

@include('partials.location-pin-script')

<div
    class="grid gap-5 md:grid-cols-2"
    x-data="hbLocationPin({
        city: @js($selectedCity),
        area: @js($selectedArea),
        lat: @js(old('latitude', $profile->latitude ?? '')),
        lng: @js(old('longitude', $profile->longitude ?? '')),
        mapsKey: @js(config('services.google.maps_key')),
        resolveUrl: @js(route('locations.resolve')),
    })"
>
    <label>
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">City</span>
        <input name="city" x-model="city" x-on:change="onNameInput()" list="hb-location-cities" required placeholder="Kampala" autocomplete="off" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
        <datalist id="hb-location-cities">
            @foreach (array_keys($locationMap) as $city)
                <option value="{{ $city }}"></option>
            @endforeach
        </datalist>
        @error('city') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
    </label>
    <label>
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Exact location</span>
        <input name="neighborhood" x-model="area" x-on:change="onNameInput()" list="hb-location-areas" required placeholder="Choose a listed area or type the exact place" autocomplete="off" class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
        <datalist id="hb-location-areas">
            @foreach ($areaSuggestions as $area)
                <option value="{{ $area }}"></option>
            @endforeach
        </datalist>
        @error('neighborhood') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
    </label>
    <div class="md:col-span-2" x-cloak x-show="status === 'found'">
        <p class="text-xs text-neutral-500">Location found.</p>
    </div>
    <div class="md:col-span-2" x-cloak x-show="status === 'checking'">
        <p class="text-xs text-neutral-500">Checking this place…</p>
    </div>
    <div class="md:col-span-2" x-cloak x-show="status === 'pin'">
        <p class="text-sm font-semibold text-neutral-900">Add a location pin</p>
        <p class="mt-1 text-xs text-neutral-500">This place is not listed yet. Click the map to drop the pin. The spot is saved for search.</p>
        <div x-ref="map" class="hb-pin-map mt-3 overflow-hidden rounded-2xl border border-neutral-200"></div>
        <p class="mt-2 text-xs font-semibold text-neutral-700" x-show="pinned" x-cloak>Pin added.</p>
    </div>
    <input type="hidden" name="latitude" x-model="lat">
    <input type="hidden" name="longitude" x-model="lng">
</div>

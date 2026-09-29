@php
    $locationMap = \App\Support\UgandaLocations::map();
    $locationPoints = collect(\App\Support\UgandaLocations::POINTS)
        ->map(fn (array $point, string $name): array => [
            'name' => $name,
            'lat' => $point[0],
            'lng' => $point[1],
            'city' => $point[2],
        ])
        ->values();
    $profile = $escort ?? null;
    $selectedCity = old('city', $profile->city ?? 'Kampala');
    $selectedArea = old('neighborhood', $profile->neighborhood ?? '');
@endphp

<div
    class="grid gap-5 md:grid-cols-2"
    x-data="{
        city: @js($selectedCity),
        area: @js($selectedArea),
        map: @js($locationMap),
        points: @js($locationPoints),
        lat: @js(old('latitude', $profile->latitude ?? '')),
        lng: @js(old('longitude', $profile->longitude ?? '')),
        get areas() {
            return this.map[this.city] || [];
        },
        locate() {
            if (! navigator.geolocation) {
                return;
            }

            navigator.geolocation.getCurrentPosition((position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                this.lat = latitude;
                this.lng = longitude;

                let best = null;
                let bestDistance = null;

                this.points.forEach((point) => {
                    const distance = (latitude - point.lat) ** 2 + (longitude - point.lng) ** 2;
                    if (bestDistance === null || distance < bestDistance) {
                        bestDistance = distance;
                        best = point;
                    }
                });

                if (! best) {
                    return;
                }

                this.city = best.city;
                const choices = this.map[best.city] || [];
                this.area = choices.includes(best.name) ? best.name : (choices[0] || best.city);
            });
        },
    }"
    x-effect="if (areas.length && ! areas.includes(area)) area = areas[0]"
>
    <label>
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">City</span>
        <select name="city" x-model="city" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
            @foreach (array_keys($locationMap) as $city)
                <option value="{{ $city }}">{{ $city }}</option>
            @endforeach
        </select>
        @error('city') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
    </label>
    <label>
        <span class="mb-2 block text-xs font-semibold uppercase tracking-wide text-neutral-500">Area</span>
        <select name="neighborhood" x-model="area" required class="w-full rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-900">
            <template x-for="choice in areas" :key="choice">
                <option :value="choice" x-text="choice"></option>
            </template>
        </select>
        @error('neighborhood') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
    </label>
    <div class="md:col-span-2">
        <button type="button" class="rounded-full border border-[#767f88] px-4 py-2 text-sm font-semibold text-[#0f0a0a] dark:text-white" @click="locate()">Use my location</button>
        <input type="hidden" name="latitude" x-model="lat">
        <input type="hidden" name="longitude" x-model="lng">
    </div>
</div>

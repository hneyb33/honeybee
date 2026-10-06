@php
    $city = (string) ($get('city') ?? '');
    $area = (string) ($get('neighborhood') ?? '');
    $latitude = $get('latitude');
    $longitude = $get('longitude');
    $statePath = $getStatePath();
    $latitudePath = preg_replace('/location_pin$/', 'latitude', $statePath);
    $longitudePath = preg_replace('/location_pin$/', 'longitude', $statePath);
@endphp

@include('partials.location-pin-script')

<div
    wire:key="location-pin-{{ md5($city.'|'.$area) }}"
    x-data="hbLocationPin({
        city: @js($city),
        area: @js($area),
        lat: @js($latitude ?? ''),
        lng: @js($longitude ?? ''),
        mapsKey: @js(config('services.google.maps_key')),
        resolveUrl: @js(route('locations.resolve')),
    })"
    x-on:location-pinned="$wire.set(@js($latitudePath), $event.detail.latitude); $wire.set(@js($longitudePath), $event.detail.longitude)"
>
    <p x-cloak x-show="status === 'found'" class="text-sm text-gray-500">Location found.</p>
    <p x-cloak x-show="status === 'checking'" class="text-sm text-gray-500">Checking this place…</p>
    <div x-cloak x-show="status === 'pin'">
        <p class="text-sm font-semibold">Add a location pin</p>
        <p class="mt-1 text-sm text-gray-500">This place is not listed yet. Click the map to drop the pin. The spot is saved for search.</p>
        <div x-ref="map" class="hb-pin-map mt-3 overflow-hidden rounded-xl border border-gray-200"></div>
        <p class="mt-2 text-sm font-semibold" x-show="pinned" x-cloak>Pin added.</p>
    </div>
</div>

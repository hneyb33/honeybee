<div>
    <div class="hb-desktop-search px-6 pb-4">
        <div class="mx-auto flex max-w-3xl items-center rounded-full border border-[#dddddd] bg-white py-2 pl-6 pr-2 shadow-[0_3px_12px_rgba(0,0,0,0.1)]">
            <label class="min-w-0 flex-1 pr-4">
                <span class="block text-xs font-semibold text-[#222]">Where</span>
                <input
                    wire:model="location"
                    list="hb-search-locations"
                    placeholder="Search destinations"
                    class="w-full border-0 bg-transparent p-0 text-sm text-[#6a6a6a] placeholder:text-[#6a6a6a] focus:ring-0"
                >
            </label>
            <label class="min-w-36 border-l border-[#dddddd] px-4">
                <span class="block text-xs font-semibold text-[#222]">Category</span>
                <select wire:model="category" class="w-full border-0 bg-transparent p-0 text-sm text-[#6a6a6a] focus:ring-0">
                    @foreach ($categories as $option)
                        <option value="{{ $option }}">{{ $option === 'bi-sexual' ? 'Bi-sexual' : ucfirst($option) }}</option>
                    @endforeach
                </select>
            </label>
            <label class="min-w-40 border-l border-[#dddddd] px-4">
                <span class="block text-xs font-semibold text-[#222]">Service</span>
                <select wire:model="serviceType" class="w-full border-0 bg-transparent p-0 text-sm text-[#6a6a6a] focus:ring-0">
                    @foreach ($services as $value => $label)
                        <option value="{{ $value }}">{{ $label }}</option>
                    @endforeach
                </select>
            </label>
            <button type="button" wire:click="search" class="hb-search-go" aria-label="Search">
                <x-lucide name="search" />
            </button>
        </div>
    </div>

    <div class="hb-mobile-pills">
        <div class="relative shrink-0" x-data="{ open: false }" x-init="$watch('$wire.needsPin', value => { if (value) open = true })">
            <button type="button" @click="open = ! open" @class([
                'inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium shadow-sm',
                'border-[#222] bg-[#222] text-white' => $location !== '',
                'border-[#dddddd] bg-white text-[#222]' => $location === '',
            ])>
                <x-lucide name="map-pin" />
                <span class="max-w-36 truncate">{{ $location !== '' ? $location : 'Where' }}</span>
            </button>
            <template x-teleport="body">
                <div x-show="open" x-cloak @click.outside="open = false" class="hb-drop">
                    <p class="text-xs font-semibold text-[#222]">Where</p>
                    <input wire:model="location" list="hb-search-locations" placeholder="City, area, or an exact place" class="mt-2 w-full rounded-xl border border-[#dddddd] px-3 py-3 text-sm">
                    <div class="mt-3 flex gap-2">
                        <button type="button" wire:click="search" @click="open = false" class="hb-drop-go px-4 py-2.5 text-sm font-semibold">Search</button>
                        <button type="button" class="rounded-full border border-[#dddddd] px-4 py-2.5 text-sm font-semibold" x-data @click="
                            if (! navigator.geolocation) { $wire.set('geoMessage', 'This browser cannot share your location.'); return; }
                            navigator.geolocation.getCurrentPosition(
                                (pos) => $wire.near(pos.coords.latitude, pos.coords.longitude),
                                () => $wire.set('geoMessage', 'Allow location access, then try Near you again.')
                            )
                        ">Near you</button>
                    </div>
                </div>
            </template>
        </div>

        <div class="relative shrink-0" x-data="{ open: false }">
            <button type="button" @click="open = ! open" class="inline-flex items-center gap-2 rounded-full border border-[#222] bg-white px-4 py-2.5 text-sm font-medium text-[#222] shadow-sm">
                <x-lucide name="users" /> {{ $category === 'bi-sexual' ? 'Bi-sexual' : ucfirst($category) }}
            </button>
            <template x-teleport="body">
                <div x-show="open" x-cloak @click.outside="open = false" class="hb-drop">
                    @foreach ($categories as $option)
                        <button type="button" wire:click="chooseCategory('{{ $option }}')" @click="open = false" class="block w-full rounded-xl px-4 py-3 text-left text-sm hover:bg-neutral-100">
                            {{ $option === 'bi-sexual' ? 'Bi-sexual' : ucfirst($option) }}
                        </button>
                    @endforeach
                </div>
            </template>
        </div>

        <div class="relative shrink-0" x-data="{ open: false }">
            <button type="button" @click="open = ! open" class="inline-flex items-center gap-2 rounded-full border border-[#dddddd] bg-white px-4 py-2.5 text-sm font-medium text-[#222] shadow-sm">
                <x-lucide name="chef-hat" /> {{ $services[$serviceType] ?? 'Services' }}
            </button>
            <template x-teleport="body">
                <div x-show="open" x-cloak @click.outside="open = false" class="hb-drop">
                    @foreach ($services as $value => $label)
                        <button type="button" wire:click="chooseService('{{ $value }}')" @click="open = false" class="block w-full rounded-xl px-4 py-3 text-left text-sm hover:bg-neutral-100">{{ $label }}</button>
                    @endforeach
                </div>
            </template>
        </div>

        <button type="button" class="inline-flex shrink-0 items-center gap-2 rounded-full border border-[#dddddd] bg-white px-4 py-2.5 text-sm font-medium text-[#222] shadow-sm" x-data @click="
            if (! navigator.geolocation) { $wire.set('geoMessage', 'This browser cannot share your location.'); return; }
            navigator.geolocation.getCurrentPosition(
                (pos) => $wire.near(pos.coords.latitude, pos.coords.longitude),
                () => $wire.set('geoMessage', 'Allow location access, then try Near you again.')
            )
        ">
            <x-lucide name="locate" /> Near you
        </button>

        @foreach (['all' => 'All', 'vip' => 'VIP', 'premium' => 'Premium', 'service' => 'Services'] as $tierOption => $label)
            <button type="button" wire:click="$dispatch('set-tier', { tier: '{{ $tierOption }}' })" @class([
                'inline-flex shrink-0 items-center rounded-full border px-4 py-2.5 text-sm font-medium shadow-sm',
                'border-[#222] bg-[#222] text-white' => $tier === $tierOption,
                'border-[#dddddd] bg-white text-[#222]' => $tier !== $tierOption,
            ])>{{ $label }}</button>
        @endforeach
    </div>

    <datalist id="hb-search-locations">
        @foreach ($locations as $city => $areas)
            <option value="{{ $city }}"></option>
            @foreach ($areas as $area)
                <option value="{{ $area }}, {{ $city }}"></option>
            @endforeach
        @endforeach
    </datalist>

    @if ($geoMessage)
        <p class="px-4 pb-2 text-sm text-[#6a6a6a]">{{ $geoMessage }}</p>
    @endif

    @include('partials.location-pin-script')
    @if ($needsPin)
        <template x-teleport="#hb-location-pin">
            <div
                class="mx-auto mt-1 max-w-3xl px-4 pb-4"
                wire:key="search-location-pin"
                x-data="hbLocationPin({ manual: true })"
                x-on:location-pinned="$wire.pin($event.detail.latitude, $event.detail.longitude)"
            >
                <div class="rounded-2xl border border-[#dddddd] bg-white p-4 shadow-sm">
                    <p class="text-sm font-semibold text-[#222]">Add a location pin</p>
                    <p class="mt-1 text-xs text-[#6a6a6a]">This place is not listed yet. Click the map to drop the pin, then press Search.</p>
                    <div x-ref="map" class="hb-pin-map mt-3 overflow-hidden rounded-xl border border-[#dddddd]"></div>
                    <p class="mt-2 text-xs font-semibold text-[#222]" x-show="pinned" x-cloak>Pin added.</p>
                </div>
            </div>
        </template>
    @endif
</div>

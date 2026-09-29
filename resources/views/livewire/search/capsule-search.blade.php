<div class="px-4 pb-4 sm:px-6 sm:pb-6">
    <style>
        .hb-search { width: 100%; max-width: 56rem; }
        @media (min-width: 640px) {
            .hb-search { flex-direction: row; align-items: center; border-radius: 9999px; padding-left: 1.5rem; }
            .hb-search > label:first-child { min-width: 0; }
            .hb-search > label:not(:first-child) { flex: 0 0 auto; border-left: 1px solid #e5e5e5; padding-left: 1rem; padding-right: 1rem; }
            .hb-search > div { flex: 0 0 auto; }
        }
    </style>
    <div class="hb-search mx-auto flex max-w-4xl flex-col gap-2 rounded-3xl border border-neutral-300 bg-white py-2 pl-4 pr-2 shadow-sm">
        <label class="min-w-0 flex-1">
            <span class="flex items-center gap-1 text-[11px] font-semibold text-neutral-900"><x-lucide name="map-pin" /> Where</span>
            <select wire:model="location" class="w-full border-0 bg-transparent p-0 text-sm text-neutral-600 focus:ring-0">
                <option value="">All locations</option>
                @foreach ($locations as $city => $areas)
                    <optgroup label="{{ $city }}">
                        @foreach ($areas as $area)
                            <option value="{{ $city }}|{{ $area }}">{{ $area }}, {{ $city }}</option>
                        @endforeach
                    </optgroup>
                @endforeach
            </select>
        </label>
        <label class="min-w-36">
            <span class="flex items-center gap-1 text-[11px] font-semibold text-neutral-900"><x-lucide name="users" /> Categories</span>
            <select wire:model="category" class="w-full border-0 bg-transparent p-0 text-sm text-neutral-600 focus:ring-0">
                @foreach ($categories as $category)
                    <option value="{{ $category }}">{{ $category === 'bi-sexual' ? 'Bi-sexual' : ucfirst($category) }}</option>
                @endforeach
            </select>
        </label>
        <label class="min-w-40">
            <span class="flex items-center gap-1 text-[11px] font-semibold text-neutral-900"><x-lucide name="chef-hat" /> Services</span>
            <select wire:model="serviceType" class="w-full border-0 bg-transparent p-0 text-sm text-neutral-600 focus:ring-0">
                @foreach ($services as $value => $label)
                    <option value="{{ $value }}">{{ $label }}</option>
                @endforeach
            </select>
        </label>
        <div class="flex items-center gap-2">
            <button type="button" wire:click="search" class="inline-flex items-center gap-2 rounded-full bg-[#0f0a0a] px-4 py-3 text-sm font-semibold text-white dark:ring-1 dark:ring-white">
                <x-lucide name="search" /> Search
            </button>
            <button type="button" class="inline-flex items-center gap-2 rounded-full border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-900" x-data @click="
                if (! navigator.geolocation) { $wire.set('geoMessage', 'This browser cannot share your location.'); return; }
                navigator.geolocation.getCurrentPosition(
                    (pos) => $wire.near(pos.coords.latitude, pos.coords.longitude),
                    () => $wire.set('geoMessage', 'Allow location access, then try Near you again.')
                )
            ">
                <x-lucide name="locate" /> Near you
            </button>
        </div>
    </div>
    @if ($geoMessage)
        <p class="mx-auto mt-2 max-w-4xl text-sm text-neutral-600">{{ $geoMessage }}</p>
    @endif
</div>

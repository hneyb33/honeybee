<div class="px-5 pb-5 lg:px-10 lg:pb-7">
    <div class="mx-auto max-w-4xl" x-data="{ openSegment: null }">
        <div class="flex flex-col overflow-visible rounded-3xl border border-gold-400/20 bg-ebony-850 shadow-2xl shadow-black/30 md:flex-row md:rounded-full">
            <div class="capsule-segment border-b md:border-r md:border-b-0 md:rounded-l-full" @click="openSegment = openSegment === 'location' ? null : 'location'">
                <div class="text-[11px] font-extrabold uppercase tracking-wide text-gold-400">Location</div>
                <div @class(['truncate text-sm', $location ? 'text-ivory-50' : 'text-ivory-50/50'])>{{ $location ?: 'Search Kampala, Entebbe...' }}</div>
                <div x-show="openSegment === 'location'" x-collapse @click.outside="openSegment = null" class="glass-panel absolute left-5 right-5 mt-4 rounded-2xl p-4 md:left-auto md:right-auto md:w-80">
                    <input type="text" wire:model.live.debounce.300ms="location" placeholder="Kololo, Naguru, Bukoto..." class="w-full rounded-xl border border-gold-400/25 bg-ink-950/70 px-4 py-3 text-sm text-ivory-50 placeholder:text-ivory-50/35">
                </div>
            </div>

            <div class="capsule-segment border-b md:border-r md:border-b-0" @click="openSegment = openSegment === 'date' ? null : 'date'">
                <div class="text-[11px] font-extrabold uppercase tracking-wide text-gold-400">Taste the honey</div>
                <div @class(['truncate text-sm', $moveInDate ? 'text-ivory-50' : 'text-ivory-50/50'])>{{ $moveInDate ?: 'Add date' }}</div>
                <div x-show="openSegment === 'date'" x-collapse @click.outside="openSegment = null" class="glass-panel absolute left-5 right-5 mt-4 rounded-2xl p-4 md:left-auto md:right-auto">
                    <input type="date" wire:model.live="moveInDate" class="rounded-xl border border-gold-400/25 bg-ink-950/70 px-4 py-3 text-sm text-ivory-50">
                </div>
            </div>

            <label class="capsule-segment border-b md:border-r md:border-b-0">
                <span class="block text-[11px] font-extrabold uppercase tracking-wide text-gold-400">Type</span>
                <select wire:model.live="propertyType" class="w-full appearance-none bg-transparent p-0 text-sm text-ivory-50/60 focus:outline-none">
                    <option class="text-ink-950" value="">Straight</option>
                    <option class="text-ink-950" value="lesbian">Lesbian</option>
                    <option class="text-ink-950" value="gay">Gay</option>
                    <option class="text-ink-950" value="Bi-sexual">Bi-sexual</option>
                </select>
            </label>

            <label class="capsule-segment border-b md:border-0">
                <span class="block text-[11px] font-extrabold uppercase tracking-wide text-gold-400">Budget</span>
                <select wire:model.live="budget" class="w-full appearance-none bg-transparent p-0 text-sm text-ivory-50/60 focus:outline-none">
                    <option class="text-ink-950" value="">Any</option>
                    <option class="text-ink-950" value="0-100000">Under 100K</option>
                    <option class="text-ink-950" value="100000-300000">100K - 300K</option>
                    <option class="text-ink-950" value="300000-999999999">300K+</option>
                    <option class="text-ink-950" value="Bargain">Custom</option>
                </select>
            </label>

            <button wire:click="search" type="button" class="m-3 inline-flex items-center justify-center gap-2 rounded-full bg-gold-400 px-6 py-3 text-sm font-extrabold text-ink-950 transition hover:bg-gold-300" wire:loading.attr="disabled">
                <svg class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <span wire:loading.remove>Search</span>
                <span wire:loading>Searching</span>
            </button>
        </div>
    </div>
</div>

<div class="px-6 pb-6">
    <div class="mx-auto flex max-w-3xl items-center rounded-full border border-neutral-300 bg-white py-2 pl-6 pr-2 shadow-sm">
        <label class="min-w-0 flex-1">
            <span class="block text-[11px] font-semibold text-neutral-900">Where</span>
            <input type="text" wire:model.live.debounce.300ms="location" placeholder="Kampala, Kololo, Entebbe" class="w-full border-0 bg-transparent p-0 text-sm text-neutral-600 placeholder:text-neutral-400 focus:ring-0">
        </label>
        <label class="hidden min-w-32 border-l border-neutral-200 px-4 sm:block">
            <span class="block text-[11px] font-semibold text-neutral-900">Kind</span>
            <select wire:model.live="kind" class="w-full border-0 bg-transparent p-0 text-sm text-neutral-600 focus:ring-0">
                <option value="">Any</option>
                <option value="escort">Escort</option>
                <option value="service">Service</option>
            </select>
        </label>
        <label class="hidden min-w-40 border-l border-neutral-200 px-4 md:block">
            <span class="block text-[11px] font-semibold text-neutral-900">Service</span>
            <select wire:model.live="serviceType" class="w-full border-0 bg-transparent p-0 text-sm text-neutral-600 focus:ring-0">
                <option value="">Any</option>
                <option value="private_chef">Private chef</option>
                <option value="home_laundry">Home laundry</option>
                <option value="private_massage">Private massage</option>
            </select>
        </label>
        <button type="button" wire:click="search" class="ml-2 rounded-full bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">Search</button>
        <button type="button" class="ml-2 hidden rounded-full border border-neutral-300 px-4 py-3 text-sm font-semibold text-neutral-900 sm:inline" x-data @click="navigator.geolocation.getCurrentPosition((pos) => { $wire.set('latitude', pos.coords.latitude); $wire.set('longitude', pos.coords.longitude); $wire.search(); })">Near you</button>
    </div>
</div>

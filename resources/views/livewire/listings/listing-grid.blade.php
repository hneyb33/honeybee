<div>
    <section class="px-5 pb-16 pt-8 lg:px-10">
        <div class="mb-6 flex items-center justify-between gap-4">
            <h2 class="font-display text-2xl font-semibold">Popular in Kampala</h2>
            <span class="text-sm font-bold text-gold-400">{{ $popular->total() }} Escorts</span>
        </div>

        <div
            class="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
            wire:key="popular-grid-{{ $tier }}-{{ md5(json_encode($searchFilters)) }}"
            x-data
            x-init="
                if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                    $nextTick(() => gsap.from($el.children, {
                        opacity: 0, y: 24, duration: 0.55, stagger: 0.05, ease: 'power2.out',
                        scrollTrigger: { trigger: $el, start: 'top 85%' }
                    }));
                }
            "
        >
            @forelse ($popular as $escort)
                <x-escort-card :escort="$escort" wire:key="escort-{{ $escort->id }}" />
            @empty
                <div class="rounded-2xl border border-gold-400/20 bg-ebony-850 p-8 text-ebony-900/70 shadow-lg shadow-ink-950/5 sm:col-span-2 lg:col-span-3 xl:col-span-5">
                    No escorts match those filters yet. Try another location or budget.
                </div>
            @endforelse
        </div>

        <div class="mt-10">{{ $popular->links() }}</div>
    </section>

    @if ($apartments->isNotEmpty())
        <section class="px-5 pb-20 lg:px-10">
            <div class="mb-6 flex items-center justify-between gap-4">
                <h2 class="font-display text-2xl font-semibold">Escorts near you</h2>
                <button type="button" wire:click="$dispatch('tier-changed', { tier: 'vip' })" class="text-sm font-bold text-gold-400 underline-offset-4 hover:underline">See all</button>
            </div>
            <div class="grid grid-cols-1 gap-x-5 gap-y-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                @foreach ($apartments as $escort)
                    <x-escort-card :escort="$escort" wire:key="nearby-{{ $escort->id }}" />
                @endforeach
            </div>
        </section>
    @endif
</div>

<div class="flex flex-wrap justify-center gap-2 px-6 pb-4">
    @foreach (['all' => 'All', 'vip' => 'VIP', 'premium' => 'Premium', 'service' => 'Services'] as $tier => $label)
        <button type="button" wire:click="setTier('{{ $tier }}')" @class([
            'rounded-full border px-4 py-2 text-sm font-medium',
            'border-neutral-900 bg-neutral-900 text-white' => $activeTier === $tier,
            'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900' => $activeTier !== $tier,
        ])>{{ $label }}</button>
    @endforeach
</div>

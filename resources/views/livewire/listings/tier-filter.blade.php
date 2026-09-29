<div class="flex flex-wrap justify-center gap-2 px-6 pb-4">
    @foreach (['all' => ['All', 'layout-grid'], 'vip' => ['VIP', 'crown'], 'premium' => ['Premium', 'sparkles'], 'service' => ['Services', 'chef-hat']] as $tier => [$label, $icon])
        <button type="button" wire:click="setTier('{{ $tier }}')" @class([
            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium',
            'border-neutral-900 bg-neutral-900 text-white' => $activeTier === $tier,
            'border-neutral-300 bg-white text-neutral-700 hover:border-neutral-900' => $activeTier !== $tier,
        ])>
            <x-lucide name="{{ $icon }}" /> {{ $label }}
        </button>
    @endforeach
</div>

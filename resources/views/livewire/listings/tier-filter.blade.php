<div class="hb-tier-root">
    @foreach (['all' => ['All', 'layout-grid'], 'vip' => ['VIP', 'crown'], 'premium' => ['Premium', 'sparkles'], 'service' => ['Services', 'chef-hat']] as $tier => [$label, $icon])
        <button type="button" wire:click="setTier('{{ $tier }}')" @class([
            'flex shrink-0 flex-col items-center gap-1 border-b-2 pb-2 text-xs font-medium',
            'border-[#222] text-[#222]' => $activeTier === $tier,
            'border-transparent text-[#6a6a6a] hover:border-[#dddddd] hover:text-[#222]' => $activeTier !== $tier,
        ])>
            <x-lucide name="{{ $icon }}" />
            {{ $label }}
        </button>
    @endforeach
</div>

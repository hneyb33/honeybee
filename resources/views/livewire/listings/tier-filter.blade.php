<div class="flex flex-wrap justify-center gap-3 px-5 pb-6 lg:px-10 lg:pb-9">
    @foreach (['all' => 'All', 'lesbian' => 'Lesbian', 'gay' => 'Gay', 'bi-sexual' => 'Bi-sexual'] as $tier => $label)
        <button type="button" wire:click="setTier('{{ $tier }}')" @class([
            'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold transition',
            'border-gold-400 bg-gold-300/20 text-ink-950 shadow-sm shadow-gold-500/10' => $activeTier === $tier,
            'border-gold-400/25 text-ebony-900/75 hover:border-gold-400/60 hover:bg-ebony-850 hover:text-ink-950' => $activeTier !== $tier,
        ])>
            @if ($tier !== 'all')
                <span @class([
                    'h-2 w-2 rounded-full',
                    'bg-condo-400' => $tier === 'lesbian',
                    'bg-gold-400' => $tier === 'gay',
                    'bg-apartment-400' => $tier === 'bi-sexual',
                ])></span>
            @endif
            {{ $label }}
        </button>
    @endforeach
</div>

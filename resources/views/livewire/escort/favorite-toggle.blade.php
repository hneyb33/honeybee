<button
    type="button"
    wire:click.prevent.stop="toggle"
    x-data="{ pulse: false }"
    @click="pulse = true; setTimeout(() => pulse = false, 260)"
    :class="pulse ? 'scale-110' : 'scale-100'"
    @class([
        'z-10 flex h-8 w-8 items-center justify-center rounded-full bg-white transition-transform',
        'absolute right-3 top-3' => ! $inline,
        'border border-neutral-300' => $inline,
    ])
    aria-label="Save to favorites"
>
    @if ($isFavorited)
        <svg class="h-5 w-5 fill-red-400 stroke-red-400 transition-colors" viewBox="0 0 24 24" stroke-width="1.8">
            <path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2 4.5 5.6 4c2.1-.3 4 .8 6.4 3.3C14.4 4.8 16.3 3.7 18.4 4c3.6.5 5.2 4.1 3.6 7.7C19.5 16.4 12 21 12 21z"/>
        </svg>
    @else
        <svg class="h-5 w-5 fill-transparent stroke-neutral-800 transition-colors" viewBox="0 0 24 24" stroke-width="1.8">
            <path d="M12 21s-7.5-4.6-10-9.3C.4 8.1 2 4.5 5.6 4c2.1-.3 4 .8 6.4 3.3C14.4 4.8 16.3 3.7 18.4 4c3.6.5 5.2 4.1 3.6 7.7C19.5 16.4 12 21 12 21z"/>
        </svg>
    @endif
</button>

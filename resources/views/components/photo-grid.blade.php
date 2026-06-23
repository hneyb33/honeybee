@props(['escort'])

@php
    $images = collect($escort->images ?: [])->take(5)->values();
@endphp

<div class="grid h-[460px] grid-cols-1 gap-2 overflow-hidden rounded-2xl md:grid-cols-[1.4fr_1fr_1fr] md:grid-rows-2">
    @forelse ($images as $image)
        <div @class([
            'bg-ebony-850',
            'md:row-span-2' => $loop->first,
            'hidden md:block' => ! $loop->first,
        ])>
            <img src="{{ $image }}" alt="{{ $escort->title }} photo {{ $loop->iteration }}" class="h-full w-full object-cover">
        </div>
    @empty
        <div class="h-full bg-gradient-to-br from-gold-400/20 via-ebony-850 to-ink-950 md:row-span-2"></div>
        @for ($i = 0; $i < 4; $i++)
            <div class="hidden bg-gradient-to-br from-condo-400/15 via-ebony-850 to-ink-950 md:block"></div>
        @endfor
    @endforelse
</div>

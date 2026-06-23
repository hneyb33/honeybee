@props(['escort'])

<a href="{{ route('escort.show', $escort) }}" class="group block">
    <div class="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-ebony-850">
        <span @class([
            'tier-badge absolute left-3 top-3 z-10',
            'text-condo-400' => $escort->tier === '',
            'text-gold-400' => $escort->tier === 'vip',
            'text-apartment-400' => $escort->tier === 'corporate',
        ])>
            <span class="h-1.5 w-1.5 rounded-full bg-current"></span>
            {{ ucfirst($escort->tier) }}
        </span>

        <livewire:escort.favorite-toggle :escort="$escort" :key="'favorite-'.$escort->id" />

        @if ($escort->cover_image)
            <img src="{{ $escort->cover_image }}" alt="{{ $escort->title }}" class="h-full w-full object-cover transition duration-500 group-hover:scale-105">
        @else
            <div class="h-full w-full bg-gradient-to-br from-gold-400/25 via-ebony-850 to-ink-950"></div>
        @endif
        <div class="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink-950/45 to-transparent"></div>
    </div>

    <div class="flex items-baseline justify-between gap-3 text-sm font-bold">
        <span class="truncate">{{ $escort->title }}</span>
        <span class="flex shrink-0 items-center gap-1 font-semibold">
            <svg class="h-3 w-3 fill-gold-400" viewBox="0 0 24 24"><path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.9-6.3 3.9 1.7-7-5.4-4.7 7.1-.6z"/></svg>
            {{ $escort->review_count > 0 ? number_format((float) $escort->rating, 2) : 'New' }}
        </span>
    </div>
    <div class="mt-3 flex flex-wrap gap-2 text-xs text-ivory-50/70">
        @if ($escort->age)
            <span class="rounded-full border border-gold-400/20 bg-ivory-50/5 px-2 py-1">{{ $escort->age }} yrs</span>
        @endif
        @if ($escort->gender)
            <span class="rounded-full border border-gold-400/20 bg-ivory-50/5 px-2 py-1">{{ ucfirst($escort->gender) }}</span>
        @endif
        @if ($escort->height)
            <span class="rounded-full border border-gold-400/20 bg-ivory-50/5 px-2 py-1">{{ $escort->height }}</span>
        @endif
        @if ($escort->availability)
            <span class="rounded-full border border-gold-400/20 bg-ivory-50/5 px-2 py-1">{{ $escort->availability }}</span>
        @endif
    </div>
    <div class="mt-3 truncate text-sm text-ivory-50/60">{{ $escort->summary_line }}</div>
    <div class="mt-3 flex items-center justify-between gap-3 text-sm">
        <span class="font-semibold">{{ $escort->price_label }}</span>
        <span class="truncate text-ivory-50/50">{{ $escort->neighborhood }}, {{ $escort->city }}</span>
    </div>
</a>

@props(['escort'])

<a href="{{ route('escort.show', $escort) }}" class="group block">
    <div class="relative mb-3 aspect-square overflow-hidden rounded-xl bg-neutral-100">
        <span class="absolute left-3 top-3 z-10 rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-neutral-900 shadow-sm">{{ $escort->tag() }}</span>
        <livewire:escort.favorite-toggle :escort="$escort" :key="'favorite-'.$escort->id" />
        @if ($escort->cover_image)
            <img src="{{ $escort->cover_image }}" alt="{{ $escort->title }}" class="h-full w-full object-cover transition duration-300 group-hover:scale-105">
        @else
            <div class="flex h-full w-full items-center justify-center text-sm text-neutral-400">No photo</div>
        @endif
    </div>
    <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
            <div class="truncate font-medium text-neutral-900">{{ $escort->title }}</div>
            <div class="truncate text-sm text-neutral-500">{{ $escort->serviceLabel() ?: $escort->neighborhood }}, {{ $escort->city }}</div>
            @if (isset($escort->distance_km))
                <div class="text-sm text-neutral-500">{{ number_format((float) $escort->distance_km, 1) }} km away</div>
            @endif
        </div>
        <div class="shrink-0 text-sm text-neutral-900">{{ $escort->review_count > 0 ? number_format((float) $escort->rating, 1) : 'New' }}</div>
    </div>
    <div class="mt-1 text-sm text-neutral-900"><span class="font-semibold">{{ $escort->price_label }}</span> <span class="text-neutral-500">/ hour</span></div>
</a>

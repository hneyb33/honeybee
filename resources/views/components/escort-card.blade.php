@props(['escort'])

@php
    $uploaded = $escort->relationLoaded('media') ? $escort->media : $escort->media()->get();
    $photos = $uploaded->where('kind', '!=', 'video')->map(fn ($media) => $media->url())->filter()->values();
    if ($photos->isEmpty() && $escort->coverImageUrl()) {
        $photos = collect([$escort->coverImageUrl()]);
    }
    $photos = $photos->take(5)->values();
    $category = $escort->kind === 'service'
        ? ($escort->serviceLabel() ?: 'Service')
        : ($escort->sexual_orientation === 'bi-sexual' ? 'Bi-sexual' : ucfirst((string) $escort->sexual_orientation));
@endphp

<a href="{{ route('escort.show', $escort) }}" class="group block">
    <div class="relative mb-3 aspect-square overflow-hidden rounded-2xl bg-neutral-100" x-data="{ i: 0, n: {{ max($photos->count(), 1) }} }">
        <span class="absolute left-3 top-3 z-10 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold text-[#222] shadow-sm">{{ $escort->tag() }}</span>
        <livewire:escort.favorite-toggle :escort="$escort" :key="'favorite-'.$escort->id" />
        @forelse ($photos as $photo)
            <img
                src="{{ $photo }}"
                alt="{{ $escort->title }}"
                @if (! $loop->first) x-cloak x-show="i === {{ $loop->index }}" @endif
                class="absolute inset-0 h-full w-full object-cover"
            >
        @empty
            <div class="flex h-full w-full items-center justify-center text-sm text-[#6a6a6a]">No photo</div>
        @endforelse
        @if ($photos->count() > 1)
            <button type="button" class="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#222] shadow md:opacity-0 md:group-hover:opacity-100" @click.prevent.stop="i = (i - 1 + n) % n" aria-label="Previous photo">‹</button>
            <button type="button" class="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-[#222] shadow md:opacity-0 md:group-hover:opacity-100" @click.prevent.stop="i = (i + 1) % n" aria-label="Next photo">›</button>
            <div class="absolute inset-x-0 bottom-3 z-10 flex justify-center gap-1">
                @foreach ($photos as $photo)
                    <span class="h-1.5 w-1.5 rounded-full" :class="i === {{ $loop->index }} ? 'bg-white' : 'bg-white/50'"></span>
                @endforeach
            </div>
        @endif
    </div>
    <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
            <div class="truncate font-medium text-[#222]">{{ $escort->title }}</div>
            <div class="truncate text-sm text-[#6a6a6a]">{{ $escort->neighborhood }}, {{ $escort->city }}</div>
            <div class="truncate text-sm text-[#6a6a6a]">{{ $category }}</div>
            @if (isset($escort->distance_km))
                <div class="text-sm text-[#6a6a6a]">{{ number_format((float) $escort->distance_km, 1) }} km away</div>
            @endif
        </div>
        <div class="flex shrink-0 items-center gap-1 text-sm text-[#222]">
            <span class="text-[#222]">★</span>
            {{ $escort->review_count > 0 ? number_format((float) $escort->rating, 1) : 'New' }}
        </div>
    </div>
    <div class="mt-1 text-sm text-[#222]"><span class="font-semibold">{{ $escort->price_label }}</span> <span class="font-normal text-[#222]">/ hour</span></div>
</a>

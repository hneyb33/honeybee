@props(['escort'])

<style>
    @media (min-width: 768px) {
        .hb-mosaic { display: grid !important; }
    }
</style>

@php
    $uploaded = $escort->relationLoaded('media') ? $escort->media : $escort->media()->get();
    $uploadedImages = $uploaded->where('kind', '!=', 'video')->map(fn ($media) => $media->url())->filter()->values();
    $images = ($uploadedImages->isNotEmpty() ? $uploadedImages : collect($escort->images ?: []))
        ->filter()
        ->take(5)
        ->values();
@endphp

<div class="md:hidden" x-data="{ i: 0, n: {{ max($images->count(), 1) }} }">
    <div class="relative aspect-square overflow-hidden rounded-2xl bg-neutral-100">
        @forelse ($images as $image)
            <img
                src="{{ $image }}"
                alt="{{ $escort->title }} photo {{ $loop->iteration }}"
                @if (! $loop->first) x-cloak x-show="i === {{ $loop->index }}" @endif
                class="absolute inset-0 h-full w-full object-cover"
            >
        @empty
            <div class="flex h-full items-center justify-center text-sm text-[#6a6a6a]">No photos yet</div>
        @endforelse
        @if ($images->count() > 1)
            <button type="button" class="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg shadow" @click="i = (i - 1 + n) % n" aria-label="Previous photo">‹</button>
            <button type="button" class="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white text-lg shadow" @click="i = (i + 1) % n" aria-label="Next photo">›</button>
            <div class="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-xs text-white" x-text="(i + 1) + ' / ' + n"></div>
        @endif
    </div>
</div>

<div class="hb-mosaic hidden h-[420px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-2xl md:grid">
    @forelse ($images as $image)
        <div @class([
            'bg-[#f7f7f7]',
            'col-span-2 row-span-2' => $loop->first,
            'hidden md:block' => ! $loop->first,
        ])>
            <img src="{{ $image }}" alt="{{ $escort->title }} photo {{ $loop->iteration }}" class="h-full w-full object-cover">
        </div>
    @empty
        <div class="col-span-2 row-span-2 flex h-full items-center justify-center bg-[#f7f7f7] text-sm text-[#6a6a6a]">No photos yet</div>
    @endforelse
</div>

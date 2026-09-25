@props(['escort'])

@php
    $uploaded = $escort->relationLoaded('media') ? $escort->media : $escort->media()->get();
    $images = collect($escort->images ?: [])
        ->merge($uploaded->map(fn ($media) => $media->url()))
        ->filter()
        ->take(5)
        ->values();
@endphp

<div class="grid h-[420px] grid-cols-1 gap-2 overflow-hidden rounded-xl md:grid-cols-4 md:grid-rows-2">
    @forelse ($images as $image)
        <div @class([
            'bg-neutral-100',
            'md:col-span-2 md:row-span-2' => $loop->first,
            'hidden md:block' => ! $loop->first,
        ])>
            <img src="{{ $image }}" alt="{{ $escort->title }} photo {{ $loop->iteration }}" class="h-full w-full object-cover">
        </div>
    @empty
        <div class="flex h-full items-center justify-center bg-neutral-100 text-sm text-neutral-400 md:col-span-2 md:row-span-2">No photos yet</div>
    @endforelse
</div>

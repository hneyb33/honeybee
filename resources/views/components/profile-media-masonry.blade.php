@props(['items' => []])

@php
    $items = collect($items)->sortBy('sort_order')->values();
@endphp

@if ($items->isEmpty())
    <p class="verification-media-empty text-sm text-neutral-500">No photos or videos have been submitted yet.</p>
@else
    <div class="hb-masonry" data-profile-masonry>
        @foreach ($items as $item)
            <figure class="hb-masonry-item">
                @if ($item->kind === 'video')
                    <video controls playsinline preload="metadata" src="{{ $item->url() }}" data-verification-media="video"></video>
                @else
                    <a href="{{ $item->url() }}" target="_blank" rel="noopener">
                        <img src="{{ $item->url() }}" alt="Submitted profile photo" data-verification-media="photo">
                    </a>
                @endif
            </figure>
        @endforeach
    </div>
@endif

@php
    $items = $media ?? collect();
    $photos = $items->where('kind', '!=', 'video')->values();
    $videos = $items->where('kind', 'video')->values();
@endphp

<div class="verification-media">
    @if ($items->isEmpty())
        <p class="verification-media-empty">No photos or videos have been submitted yet.</p>
    @else
        @if ($photos->isNotEmpty())
            <p class="verification-media-label">Photos</p>
            <div class="verification-media-grid">
                @foreach ($photos as $photo)
                    <a href="{{ $photo->url() }}" target="_blank" rel="noopener" class="verification-media-link">
                        <img src="{{ $photo->url() }}" alt="Submitted verification photo" data-verification-media="photo">
                        <span>Open photo</span>
                    </a>
                @endforeach
            </div>
        @endif

        @if ($videos->isNotEmpty())
            <p class="verification-media-label">Videos</p>
            @foreach ($videos as $video)
                <video class="verification-media-video" controls playsinline preload="metadata" src="{{ $video->url() }}" data-verification-media="video"></video>
                <a href="{{ $video->url() }}" target="_blank" rel="noopener" class="verification-media-file">Open video in a new tab</a>
            @endforeach
        @endif
    @endif
</div>

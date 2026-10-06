@php
    $galleryRecord = $escort ?? $profile ?? null;
    $gallery = collect($media ?? null);
    if ($gallery->isEmpty() && $galleryRecord) {
        $gallery = $galleryRecord->relationLoaded('media')
            ? $galleryRecord->media
            : $galleryRecord->media()->orderBy('sort_order')->get();
    }
@endphp
<label class="flex min-h-40 cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-[#767f88] bg-[#f4f5f6] px-6 py-8 text-center dark:bg-[#241e1e]" x-data="{ names: [] }">
    <span class="text-base font-semibold text-[#0f0a0a] dark:text-white">{{ $uploadLabel ?? 'Upload photos' }}</span>
    <span class="mt-2 max-w-sm text-sm text-[#767f88]">{{ $uploadHelper ?? 'Add at least 3 photos and one video' }}</span>
    <span class="mt-3 text-xs text-[#767f88]" x-show="names.length" x-text="names.join(', ')"></span>
    <input
        type="file"
        name="photos[]"
        multiple
        accept="image/*,video/*"
        class="sr-only"
        @change="names = [...$event.target.files].map((file) => file.name)"
    >
</label>
@error('photos') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
@if ($gallery->isNotEmpty())
    <div class="mt-4">
        <p class="mb-3 text-sm font-semibold text-[#0f0a0a] dark:text-white">Photos and videos already added</p>
        <x-profile-media-masonry :items="$gallery" />
    </div>
@endif

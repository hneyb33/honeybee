<x-layouts.app :title="'Review '.$escort->title.' - Honeybee'">
    <section class="mx-auto max-w-lg px-4 py-8 sm:px-6">
        <a href="{{ route('escort.show', $escort) }}" class="text-sm font-semibold underline">Back to profile</a>
        <h1 class="mt-4 text-2xl font-semibold text-[#222]">Review {{ $escort->title }}</h1>
        <p class="mt-1 text-sm text-[#6a6a6a]">{{ $escort->neighborhood }}, {{ $escort->city }}</p>

        <form method="POST" action="{{ route('escorts.review.store', $escort) }}" class="mt-8" x-data="{ rating: {{ (int) old('rating', $review->rating ?? 0) }} }">
            @csrf
            <p class="text-sm font-semibold text-[#222]">Rating</p>
            <div class="mt-2 flex gap-1">
                @for ($star = 1; $star <= 5; $star++)
                    <button type="button" class="text-3xl leading-none" :class="rating >= {{ $star }} ? 'text-[#FF385C]' : 'text-[#dddddd]'" @click="rating = {{ $star }}" aria-label="{{ $star }} stars">★</button>
                @endfor
            </div>
            <input type="hidden" name="rating" :value="rating">
            @error('rating') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror

            <label class="mt-6 block">
                <span class="text-sm font-semibold text-[#222]">Your review</span>
                <textarea name="body" rows="5" class="mt-2 w-full rounded-xl border border-[#dddddd] px-4 py-3 text-sm text-[#222]" placeholder="What stood out?">{{ old('body', $review->body ?? '') }}</textarea>
                @error('body') <span class="mt-2 block text-xs font-bold text-red-600">{{ $message }}</span> @enderror
            </label>

            <button type="submit" class="mt-6 rounded-full bg-[#FF385C] px-6 py-3 text-sm font-semibold text-white">Save review</button>
        </form>
    </section>
</x-layouts.app>

<x-layouts.app :title="$escort->title.' - Honeybee'">
    <div class="mx-auto max-w-6xl px-4 py-6 pb-28 sm:px-6 sm:py-8">
        @if (session('status'))
            <p class="mb-6 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-800">{{ session('status') }}</p>
        @endif

        @if (auth()->id() === $escort->user_id)
            <div class="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 bg-[#f4f5f6] px-4 py-3 text-sm text-neutral-800">
                <p>This is how your profile appears.</p>
                <a href="{{ route('owner.escorts.edit', $escort) }}" class="font-semibold underline">Edit profile</a>
            </div>
        @endif

        @include('pages.partials.public-profile', ['escort' => $escort, 'showBooking' => true])
    </div>
</x-layouts.app>

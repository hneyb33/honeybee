<x-layouts.app title="Your bookings - Honeybee">
    <section class="mx-auto max-w-3xl px-6 py-10">
        <h1 class="text-3xl font-semibold text-neutral-900">Your bookings</h1>
        @if (session('status'))
            <p class="mt-4 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-800">{{ session('status') }}</p>
        @endif
        <div class="mt-8 space-y-4">
            @forelse ($bookings as $booking)
                <article class="rounded-xl border border-neutral-200 p-4">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h2 class="font-medium text-neutral-900">{{ $booking->escort->title }}</h2>
                            <p class="text-sm text-neutral-500">{{ $booking->starts_at->toFormattedDateString() }} · {{ $booking->duration_hours }}h</p>
                        </div>
                        <span class="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase text-neutral-700">{{ $booking->status }}</span>
                    </div>
                    @if ($booking->status === 'accepted')
                        <div class="mt-3 flex gap-4 text-sm">
                            <a class="underline" href="https://wa.me/{{ $booking->escort->whatsapp_number }}" target="_blank">WhatsApp</a>
                            @if ($booking->escort->telegram)
                                <a class="underline" href="https://t.me/{{ ltrim($booking->escort->telegram, '@') }}" target="_blank">Telegram</a>
                            @endif
                        </div>
                    @endif
                    @if ($booking->status === 'completed' && ! $booking->review)
                        <form method="POST" action="{{ route('client.reviews.store', $booking) }}" class="mt-4 flex items-center gap-3">
                            @csrf
                            <select name="rating" class="rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                                @for ($i = 5; $i >= 1; $i--)
                                    <option value="{{ $i }}">{{ $i }}</option>
                                @endfor
                            </select>
                            <input name="body" placeholder="How was it?" class="flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-sm">
                            <button class="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">Review</button>
                        </form>
                    @endif
                </article>
            @empty
                <p class="text-sm text-neutral-500">You have no booking requests yet.</p>
            @endforelse
        </div>
    </section>
</x-layouts.app>

<x-layouts.app title="Dashboard - Honeybee">
    <section class="mx-auto max-w-5xl px-6 py-10">
        <div class="mb-8 flex items-end justify-between gap-4">
            <div>
                <h1 class="text-3xl font-semibold text-neutral-900">Specialist dashboard</h1>
                <p class="mt-2 text-sm text-neutral-500">Update your profile, manage requests, and message clients on WhatsApp or Telegram after you accept.</p>
            </div>
            @if (auth()->user()->isHomeSpecialist() && $escorts->first()?->onboarding_step !== 'complete')
                <a href="{{ route('provider.onboard') }}" class="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">Continue onboarding</a>
            @elseif (! auth()->user()->isHomeSpecialist())
                <a href="{{ route('owner.escorts.create') }}" class="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">Add profile</a>
            @endif
        </div>

        @if (session('status'))
            <p class="mb-6 rounded-lg bg-neutral-100 px-4 py-3 text-sm">{{ session('status') }}</p>
        @endif

        @unless (auth()->user()->hasActiveSpecialistSubscription())
            <a href="{{ route('subscribe') }}" class="mt-3 inline-block rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white">Choose a subscription</a>
        @endunless

        <h2 class="mb-3 text-lg font-semibold">Booking requests</h2>
        <div class="mb-10 space-y-3">
            @forelse ($bookings as $booking)
                <article class="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-neutral-200 p-4">
                    <div>
                        <div class="font-medium">{{ $booking->client->name }} · {{ $booking->escort->title }}</div>
                        <div class="text-sm text-neutral-500">{{ $booking->starts_at->toFormattedDateString() }} · {{ $booking->status }}</div>
                    </div>
                    <form method="POST" action="{{ route('owner.bookings.respond', $booking) }}" class="flex gap-2">
                        @csrf
                        <button name="status" value="accepted" class="rounded-lg border border-neutral-300 px-3 py-2 text-sm">Accept</button>
                        <button name="status" value="declined" class="rounded-lg border border-neutral-300 px-3 py-2 text-sm">Decline</button>
                        <button name="status" value="completed" class="rounded-lg border border-neutral-300 px-3 py-2 text-sm">Complete</button>
                    </form>
                </article>
            @empty
                <p class="text-sm text-neutral-500">No requests yet.</p>
            @endforelse
        </div>

        <h2 class="mb-3 text-lg font-semibold">Profiles</h2>
        <div class="grid gap-4 md:grid-cols-2">
            @forelse ($escorts as $escort)
                <article class="rounded-xl border border-neutral-200 p-4">
                    <div class="flex items-start justify-between">
                        <div>
                            <h3 class="font-medium">{{ $escort->title }}</h3>
                            <p class="text-sm text-neutral-500">{{ $escort->tag() }} · {{ $escort->verification_status }}</p>
                        </div>
                        <a href="{{ route('owner.escorts.edit', $escort) }}" class="text-sm underline">Edit</a>
                    </div>
                </article>
            @empty
                <p class="text-sm text-neutral-500">No profiles yet.</p>
            @endforelse
        </div>
    </section>
</x-layouts.app>

<x-layouts.app title="Dashboard - Honeybee">
    <section class="mx-auto max-w-5xl px-6 py-10">
        <div class="mb-8 flex items-end justify-between gap-4">
            <div>
                <h1 class="inline-flex items-center gap-2 text-3xl font-semibold text-neutral-900"><x-lucide name="layout-dashboard" /> Specialist dashboard</h1>
                <p class="mt-2 text-sm text-neutral-500">Update your profile. Clients reach you on WhatsApp or Telegram.</p>
            </div>
            @if (auth()->user()->isHomeSpecialist() && $escorts->first()?->onboarding_step !== 'complete')
                <a href="{{ route('provider.onboard') }}" class="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"><x-lucide name="badge-plus" /> Continue onboarding</a>
            @elseif (! auth()->user()->isHomeSpecialist())
                <a href="{{ route('owner.escorts.create') }}" class="inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"><x-lucide name="badge-plus" /> Add profile</a>
            @endif
        </div>

        @if (session('status'))
            <p class="mb-6 rounded-lg bg-neutral-100 px-4 py-3 text-sm">{{ session('status') }}</p>
        @endif

        @if (! empty($subscription))
            <div class="mb-6 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700">
                <p class="font-semibold text-neutral-900">{{ \App\Models\Subscription::label($subscription->plan) }} is active</p>
                <p class="mt-1">{{ ucfirst($subscription->period) }} listing until {{ $subscription->ends_at?->format('j M Y') }}.</p>
            </div>
        @elseif (! empty($latestPayment) && $latestPayment->status !== \App\Enums\PaymentStatus::Verified)
            <div class="mb-6 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700">
                <p class="font-semibold text-neutral-900">Payment {{ $latestPayment->status->label() }}</p>
                <a href="{{ route('payments.show', $latestPayment) }}" class="mt-2 inline-block font-semibold underline">View payment {{ $latestPayment->reference }}</a>
            </div>
        @else
            <div class="mb-6 rounded-xl border border-neutral-200 p-4">
                <p class="text-sm text-neutral-700">Every profile needs an active subscription before it appears in the listings.</p>
                <a href="{{ route('subscribe') }}" class="mt-3 inline-flex items-center gap-2 rounded-lg bg-neutral-900 px-4 py-2 text-sm font-semibold text-white"><x-lucide name="credit-card" /> Choose a subscription</a>
            </div>
        @endif

        <h2 class="mb-3 text-lg font-semibold">Your profile</h2>
        <div class="space-y-10">
            @forelse ($escorts as $escort)
                <article class="rounded-2xl border border-neutral-200 p-4 sm:p-6">
                    <div class="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm">
                        <p class="text-neutral-600">This is how your profile appears. Status: {{ str_replace('_', ' ', $escort->verification_status) }}.</p>
                        <div class="flex gap-4 font-semibold">
                            <a href="{{ route('escort.show', $escort) }}" class="underline">View public page</a>
                            <a href="{{ route('owner.escorts.edit', $escort) }}" class="underline">Edit</a>
                        </div>
                    </div>
                    @include('pages.partials.public-profile', ['escort' => $escort, 'showBooking' => false])
                </article>
            @empty
                <p class="text-sm text-neutral-500">No profiles yet.</p>
            @endforelse
        </div>
    </section>
</x-layouts.app>

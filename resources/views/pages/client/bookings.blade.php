<x-layouts.app title="Your contacts - Honeybee">
    <section class="mx-auto max-w-3xl px-6 py-10">
        <h1 class="inline-flex items-center gap-2 text-3xl font-semibold text-neutral-900"><x-lucide name="message" /> Your contacts</h1>
        <p class="mt-2 text-sm text-neutral-500">You reach escorts and service providers on WhatsApp or Telegram. There is no booking request.</p>
        @if (session('status'))
            <p class="mt-4 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-800">{{ session('status') }}</p>
        @endif
        @if (! empty($subscription) && $subscription->plan === \App\Models\Subscription::PLAN_CLIENT_PREMIUM)
            <div class="mt-6 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700">
                <p class="font-semibold text-neutral-900">{{ \App\Models\Subscription::label($subscription->plan) }} is active</p>
                <p class="mt-1">{{ ucfirst($subscription->period) }} access until {{ $subscription->ends_at?->format('j M Y') }}.</p>
            </div>
        @elseif (! empty($latestPayment) && $latestPayment->status !== \App\Enums\PaymentStatus::Verified)
            <div class="mt-6 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700">
                <p class="font-semibold text-neutral-900">Payment {{ $latestPayment->status->label() }}</p>
                <a href="{{ route('payments.show', $latestPayment) }}" class="mt-2 inline-block font-semibold underline">View payment {{ $latestPayment->reference }}</a>
            </div>
        @elseif (empty($subscription) || $subscription->plan !== \App\Models\Subscription::PLAN_CLIENT_PREMIUM)
            <div class="mt-6 rounded-xl border border-neutral-200 p-4 text-sm text-neutral-700">
                <p>Premium escorts and service providers are open. VIP escorts need a subscription.</p>
                <a href="{{ route('subscribe') }}" class="mt-2 inline-block font-semibold underline">View VIP escorts</a>
            </div>
        @endif
        <div class="mt-8 space-y-4">
            @forelse ($bookings as $booking)
                <article class="rounded-xl border border-neutral-200 p-4">
                    <div class="flex items-start justify-between gap-4">
                        <div>
                            <h2 class="font-medium text-neutral-900">{{ $booking->escort->title }}</h2>
                            <p class="text-sm text-neutral-500">{{ $booking->created_at->format('j M Y, H:i') }}</p>
                        </div>
                        <span class="rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold uppercase text-neutral-700">{{ $booking->channel === 'telegram' ? 'Telegram' : 'WhatsApp' }}</span>
                    </div>
                </article>
            @empty
                <p class="text-sm text-neutral-500">You have not contacted a profile yet.</p>
            @endforelse
        </div>
    </section>
</x-layouts.app>

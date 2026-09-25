<x-layouts.app :title="$escort->title.' - Honeybee'">
    <div class="mx-auto max-w-6xl px-6 py-8">
        @if (session('status'))
            <p class="mb-6 rounded-lg bg-neutral-100 px-4 py-3 text-sm text-neutral-800">{{ session('status') }}</p>
        @endif

        <div class="mb-4 flex flex-col justify-between gap-4 md:flex-row md:items-start">
            <div>
                <div class="mb-2 flex items-center gap-2">
                    <span class="rounded-full bg-neutral-900 px-2.5 py-1 text-xs font-semibold text-white">{{ $escort->tag() }}</span>
                    @if ($escort->serviceLabel())
                        <span class="text-sm text-neutral-500">{{ $escort->serviceLabel() }}</span>
                    @endif
                </div>
                <h1 class="text-3xl font-semibold tracking-tight text-neutral-900">{{ $escort->title }}</h1>
                <p class="mt-2 text-sm text-neutral-600">{{ $escort->neighborhood }}, {{ $escort->city }} · {{ $escort->review_count > 0 ? number_format((float) $escort->rating, 1).' · '.$escort->review_count.' reviews' : 'New' }}</p>
            </div>
            <div class="flex gap-2 text-sm font-medium" x-data="{ copied: false }">
                <button type="button" class="rounded-lg px-3 py-2 underline" @click="navigator.clipboard.writeText(window.location.href); copied = true">
                    <span x-show="!copied">Share</span>
                    <span x-show="copied">Link copied</span>
                </button>
                <livewire:escort.favorite-toggle :escort="$escort" :inline="true" />
            </div>
        </div>

        <x-photo-grid :escort="$escort" />

        <div class="mt-8 grid gap-12 lg:grid-cols-[1.6fr_0.9fr]">
            <div>
                <div class="mb-8 border-b border-neutral-200 pb-8">
                    <h2 class="text-2xl font-semibold text-neutral-900">{{ $escort->tag() }} profile hosted by {{ $escort->owner?->name ?? 'Honeybee' }}</h2>
                    <p class="mt-2 text-sm text-neutral-600">{{ $escort->age }} yrs · {{ ucfirst($escort->gender) }}@if ($escort->build) · {{ $escort->build }}@endif · {{ $escort->availability }}</p>
                </div>
                <section class="border-b border-neutral-200 pb-8">
                    <h2 class="mb-3 text-xl font-semibold">About</h2>
                    <p class="max-w-2xl leading-7 text-neutral-700">{{ $escort->description }}</p>
                </section>
                @if ($escort->services_offered)
                    <section class="py-8">
                        <h2 class="mb-4 text-xl font-semibold">What is offered</h2>
                        <div class="grid gap-3 sm:grid-cols-2">
                            @foreach (collect($escort->services_offered)->take(8) as $service)
                                <div class="rounded-xl border border-neutral-200 px-4 py-3 text-sm text-neutral-800">{{ $service }}</div>
                            @endforeach
                        </div>
                    </section>
                @endif
            </div>
            <livewire:escort.booking-dock :escort="$escort" />
        </div>
    </div>
</x-layouts.app>

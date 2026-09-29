<x-layouts.app title="Confirm a reference - Honeybee">
    <section class="mx-auto max-w-lg px-6 py-16">
        <h1 class="text-3xl font-semibold text-neutral-900">Reference</h1>
        @if (session('status'))
            <p class="mt-4 rounded-lg bg-neutral-100 px-4 py-3 text-sm">{{ session('status') }}</p>
        @endif
        <p class="mt-4 leading-7 text-neutral-700">
            {{ $reference->escort?->title ?? 'A provider' }} listed you as someone who knows their work
            @if ($reference->escort?->serviceLabel())
                as a {{ strtolower($reference->escort->serviceLabel()) }}
            @endif.
        </p>
        <p class="mt-2 text-sm text-neutral-500">{{ $reference->name }} · {{ $reference->relationshipLabel() }}</p>

        @if ($reference->status === \App\Models\EscortReference::CONFIRMED)
            <p class="mt-6 rounded-xl border border-neutral-200 px-4 py-4 text-sm font-semibold">Reference confirmed</p>
        @elseif ($reference->status === \App\Models\EscortReference::REJECTED)
            <p class="mt-6 rounded-xl border border-neutral-200 px-4 py-4 text-sm">You said you do not know this work.</p>
        @else
            <p class="mt-6 text-sm text-neutral-700">Please confirm whether you know {{ $reference->escort?->title ?? 'this person' }} professionally.</p>
            <form method="POST" action="{{ route('references.confirm.store', $reference->verification_token) }}" class="mt-4 flex flex-wrap gap-3">
                @csrf
                <button name="answer" value="yes" class="rounded-lg bg-[#0f0a0a] px-4 py-3 text-sm font-semibold text-white">Yes, I know this person</button>
                <button name="answer" value="no" class="rounded-lg border border-neutral-300 px-4 py-3 text-sm font-semibold">I don't know this person</button>
            </form>
        @endif
    </section>
</x-layouts.app>

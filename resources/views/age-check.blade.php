<x-guest-layout>
    <div class="space-y-6 text-center text-neutral-900">
        <div>
            <p class="mb-3 text-xs font-extrabold uppercase tracking-[0.22em] text-neutral-500">Age verification</p>
            <h1 class="text-3xl font-semibold md:text-4xl">You must be 18 or older to continue</h1>
            <p class="mt-4 text-sm leading-relaxed text-neutral-900/80">This site contains adult-oriented content. Please confirm that you are at least 18 years of age before entering.</p>
        </div>

        <div class="rounded-3xl border border-neutral-200 bg-white p-6 text-left shadow-lg shadow-ink-950/5">
            <h2 class="mb-4 text-xl font-semibold">Rules & guidelines</h2>
            <ul class="space-y-3 text-sm text-neutral-900/85">
                <li class="flex items-start gap-3"><span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white">1</span> You must be 18 years of age or older to access this site.</li>
                <li class="flex items-start gap-3"><span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white">2</span> All interactions and communication must remain respectful.</li>
                <li class="flex items-start gap-3"><span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white">3</span> No minors, prohibited services, or unsafe requests are permitted.</li>
                <li class="flex items-start gap-3"><span class="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-neutral-900 text-[10px] font-bold text-white">4</span> Use a valid form of ID where required and follow local laws.</li>
            </ul>
        </div>

        @if(session('age_denied'))
            <div class="rounded-3xl border border-red-400/20 bg-red-50 p-4 text-sm text-red-900">
                You must be 18 years or older to continue. Please return when you meet the age requirement.
            </div>
        @endif

        <div class="grid gap-4 sm:grid-cols-2">
            <form method="POST" action="{{ route('age-check.submit') }}" class="space-y-4">
                @csrf
                <button type="submit" name="over_18" value="1" class="inline-flex w-full items-center justify-center rounded-lg bg-neutral-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-neutral-900">Yes, I am 18+ and accept the rules</button>
            </form>

            <a href="https://www.google.com" class="inline-flex w-full items-center justify-center rounded-full border border-ink-950/10 bg-white px-6 py-3 text-sm font-semibold text-neutral-900 transition hover:bg-white">No, leave site</a>
        </div>
    </div>
</x-guest-layout>

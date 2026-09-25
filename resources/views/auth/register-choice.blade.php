<x-guest-layout>
    <h1 class="text-2xl font-semibold text-neutral-900">Register as</h1>
    <p class="mt-2 text-sm text-neutral-600">Choose the account that matches what you want to do.</p>
    <div class="mt-6 space-y-3">
        <a href="{{ route('register.form', 'client') }}" class="block rounded-xl border border-neutral-200 px-4 py-4 hover:border-neutral-900">
            <span class="block font-semibold text-neutral-900">Client</span>
            <span class="mt-1 block text-sm text-neutral-600">Browse, book, save, and review.</span>
        </a>
        <a href="{{ route('register.form', 'model') }}" class="block rounded-xl border border-neutral-200 px-4 py-4 hover:border-neutral-900">
            <span class="block font-semibold text-neutral-900">Model</span>
            <span class="mt-1 block text-sm text-neutral-600">Provide escort services.</span>
        </a>
        <a href="{{ route('register.form', 'specialist') }}" class="block rounded-xl border border-neutral-200 px-4 py-4 hover:border-neutral-900">
            <span class="block font-semibold text-neutral-900">Specialist</span>
            <span class="mt-1 block text-sm text-neutral-600">Provide home services such as private chef, laundry, or massage.</span>
        </a>
    </div>
    <a href="{{ route('login') }}" class="mt-6 inline-block text-sm text-neutral-600 underline">Already registered? Log in</a>
</x-guest-layout>

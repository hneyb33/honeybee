<div>
    <section class="mx-auto max-w-7xl px-6 pb-16">
        <div class="mb-4 flex items-end justify-between">
            <h2 class="text-xl font-semibold text-neutral-900">Popular near Kampala</h2>
            <span class="text-sm text-neutral-500">{{ $popular->total() }} profiles</span>
        </div>
        <div class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            @forelse ($popular as $escort)
                <x-escort-card :escort="$escort" wire:key="escort-{{ $escort->id }}" />
            @empty
                <div class="rounded-xl border border-neutral-200 p-8 text-sm text-neutral-600 sm:col-span-2 lg:col-span-3 xl:col-span-4">
                    No verified profiles match that search yet.
                </div>
            @endforelse
        </div>
        <div class="mt-10">{{ $popular->links() }}</div>
    </section>
</div>

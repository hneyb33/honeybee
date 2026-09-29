<div>
    <section class="mx-auto max-w-7xl px-4 pb-12 sm:px-6 sm:pb-16">
        <div class="mb-4 flex items-end justify-between gap-3">
            <h2 class="text-lg font-semibold text-neutral-900 sm:text-xl">Popular near Kampala</h2>
            <span class="shrink-0 text-sm text-neutral-500">{{ $popular->total() }} profiles</span>
        </div>
        <div class="grid grid-cols-2 gap-x-4 gap-y-6 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 xl:grid-cols-4">
            @forelse ($popular as $escort)
                <x-escort-card :escort="$escort" wire:key="escort-{{ $escort->id }}" />
            @empty
                <div class="col-span-2 rounded-xl border border-neutral-200 p-6 text-sm text-neutral-600 sm:p-8 lg:col-span-3 xl:col-span-4">
                    No verified profiles match that search yet.
                </div>
            @endforelse
        </div>
        <div class="mt-10">{{ $popular->links() }}</div>
    </section>
</div>

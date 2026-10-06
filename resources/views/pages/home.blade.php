<x-layouts.app>
    <style>
        .hb-home-intro { display: none; }
        @media (min-width: 768px) {
            .hb-home-intro { display: block; }
        }
    </style>
    <section class="hb-home-intro mx-auto max-w-7xl px-6 pb-2 pt-6">
        <h1 class="max-w-2xl text-3xl font-semibold tracking-tight text-[#222]">Places to connect in Kampala</h1>
    </section>
    <livewire:listings.listing-grid />
</x-layouts.app>

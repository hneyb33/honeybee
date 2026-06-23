<?php

namespace App\Livewire\Listings;

use App\Models\Escort;
use Livewire\Attributes\On;
use Livewire\Component;
use Livewire\WithPagination;

class ListingGrid extends Component
{
    use WithPagination;

    public string $tier = 'all';

    /** @var array<string, string|null> */
    public array $searchFilters = [];

    #[On('tier-changed')]
    public function updateTier(string $tier): void
    {
        $this->tier = $tier;
        $this->resetPage();
    }

    #[On('filters-updated')]
    public function updateFilters(array $filters): void
    {
        $this->searchFilters = $filters;
        $this->resetPage();
    }

    public function render()
    {
        $query = Escort::query()
            ->when($this->tier !== 'all', fn ($query) => $query->where('tier', $this->tier))
            ->when($this->searchFilters['location'] ?? null, function ($query, string $location) {
                $query->where(function ($query) use ($location) {
                    $query->where('neighborhood', 'like', "%{$location}%")
                        ->orWhere('city', 'like', "%{$location}%")
                        ->orWhere('title', 'like', "%{$location}%");
                });
            })
            ->when($this->searchFilters['type'] ?? null, fn ($query, string $type) => $query->where('tier', $type))
            ->when($this->searchFilters['budget'] ?? null, function ($query, string $budget) {
                [$min, $max] = array_pad(explode('-', $budget), 2, null);
                $query->when($min !== null, fn ($query) => $query->where('monthly_price', '>=', (int) $min))
                    ->when($max !== null, fn ($query) => $query->where('monthly_price', '<=', (int) $max));
            })
            ->orderByDesc('is_featured')
            ->orderByDesc('rating');

        return view('livewire.listings.listing-grid', [
            'popular' => (clone $query)->paginate(10),
            'apartments' => Escort::query()->where('tier', 'apartment')->orderByDesc('rating')->limit(5)->get(),
        ]);
    }
}

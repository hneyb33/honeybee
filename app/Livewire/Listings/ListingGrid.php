<?php

namespace App\Livewire\Listings;

use App\Models\Escort;
use Illuminate\Database\Eloquent\Builder;
use Livewire\Attributes\On;
use Livewire\Component;
use Livewire\WithPagination;

class ListingGrid extends Component
{
    use WithPagination;

    public string $tier = 'all';

    /** @var array<string, mixed> */
    public array $searchFilters = [];

    public $escorts;

    public function mount(): void
    {
        $this->escorts = $this->baseQuery()->latest()->take(12)->get();
    }

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
        return view('livewire.listings.listing-grid', [
            'popular' => $this->baseQuery()->paginate(12),
        ]);
    }

    private function baseQuery(): Builder
    {
        $latitude = isset($this->searchFilters['latitude']) ? (float) $this->searchFilters['latitude'] : null;
        $longitude = isset($this->searchFilters['longitude']) ? (float) $this->searchFilters['longitude'] : null;

        return Escort::query()
            ->visibleTo(auth()->user())
            ->when($this->tier === 'vip' || $this->tier === 'premium', fn (Builder $query) => $query->where('kind', Escort::KIND_ESCORT)->where('escort_tier', $this->tier))
            ->when($this->tier === 'service', fn (Builder $query) => $query->where('kind', Escort::KIND_SERVICE))
            ->when($this->searchFilters['location'] ?? null, function (Builder $query, string $location) {
                $query->where(function (Builder $query) use ($location) {
                    $query->where('neighborhood', 'like', "%{$location}%")
                        ->orWhere('city', 'like', "%{$location}%")
                        ->orWhere('title', 'like', "%{$location}%");
                });
            })
            ->when($this->searchFilters['kind'] ?? null, fn (Builder $query, string $kind) => $query->where('kind', $kind))
            ->when($this->searchFilters['service_type'] ?? null, fn (Builder $query, string $type) => $query->where('service_type', $type))
            ->when($latitude && $longitude, function (Builder $query) use ($latitude, $longitude) {
                $query->whereNotNull('latitude')
                    ->select('escorts.*')
                    ->selectRaw(
                        '(6371 * acos(cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))) as distance_km',
                        [$latitude, $longitude, $latitude],
                    )
                    ->orderBy('distance_km');
            }, function (Builder $query) {
                $query->orderByDesc('is_featured')->latest();
            });
    }
}

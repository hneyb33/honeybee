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
        $location = (string) request()->query('where', '');
        $category = request()->query('category');
        $service = request()->query('service');

        if ($location !== '' || $category !== null || $service !== null) {
            $this->searchFilters = [
                'location' => $location,
                'category' => (string) ($category ?? ''),
                'service_type' => (string) ($service ?? ''),
                'latitude' => null,
                'longitude' => null,
            ];
        }

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
            ->with('media')
            ->visibleTo(auth()->user())
            ->when($this->tier === 'vip' || $this->tier === 'premium', fn (Builder $query) => $query->where('kind', Escort::KIND_ESCORT)->where('escort_tier', $this->tier))
            ->when($this->tier === 'service', fn (Builder $query) => $query->where('kind', Escort::KIND_SERVICE))
            ->when($this->searchFilters['location'] ?? null, function (Builder $query, string $location) {
                $parts = array_values(array_filter(preg_split('/\|+/', $location) ?: []));

                if (count($parts) >= 2) {
                    $query->where('city', 'like', '%'.$parts[0].'%')
                        ->where('neighborhood', 'like', '%'.$parts[1].'%');
                } elseif ($parts !== []) {
                    $query->where(function (Builder $query) use ($parts) {
                        $query->where('city', 'like', '%'.$parts[0].'%')
                            ->orWhere('neighborhood', 'like', '%'.$parts[0].'%');
                    });
                }
            })
            ->when(
                ($this->searchFilters['category'] ?? null) || ($this->searchFilters['service_type'] ?? null),
                function (Builder $query) {
                    $category = $this->searchFilters['category'] ?? null;
                    $service = $this->searchFilters['service_type'] ?? null;

                    $query->where(function (Builder $query) use ($category, $service) {
                        if ($category) {
                            $query->orWhere(function (Builder $escort) use ($category) {
                                $escort->where('kind', Escort::KIND_ESCORT)
                                    ->whereIn('sexual_orientation', Escort::orientationMatches($category));
                            });
                        }

                        if ($service) {
                            $aliases = array_values(array_unique([
                                $service,
                                str_replace('_', '-', $service),
                                str_replace('-', '_', $service),
                            ]));

                            $query->orWhere(function (Builder $serviceQuery) use ($aliases) {
                                $serviceQuery->where('kind', Escort::KIND_SERVICE)
                                    ->whereIn('service_type', $aliases);
                            });
                        }
                    });
                },
            )
            ->when($latitude && $longitude, function (Builder $query) use ($latitude, $longitude) {
                $query->select('escorts.*')->selectRaw(
                    'CASE WHEN latitude IS NULL OR longitude IS NULL THEN NULL ELSE (6371 * acos(MIN(1, MAX(-1, cos(radians(?)) * cos(radians(latitude)) * cos(radians(longitude) - radians(?)) + sin(radians(?)) * sin(radians(latitude)))))) END as distance_km',
                    [$latitude, $longitude, $latitude],
                )->orderByRaw('CASE WHEN distance_km IS NULL THEN 1 ELSE 0 END')->orderBy('distance_km');
            }, function (Builder $query) {
                $query->orderByDesc('is_featured')->latest();
            });
    }
}

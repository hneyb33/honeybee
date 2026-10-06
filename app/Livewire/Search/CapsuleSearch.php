<?php

namespace App\Livewire\Search;

use App\Models\Escort;
use App\Support\HomeServiceCatalog;
use App\Support\Places;
use App\Support\UgandaLocations;
use Livewire\Attributes\On;
use Livewire\Attributes\Url;
use Livewire\Component;

class CapsuleSearch extends Component
{
    #[Url(as: 'where')]
    public string $location = '';

    #[Url(as: 'category')]
    public string $category = 'straight';

    #[Url(as: 'service')]
    public string $serviceType = 'private_chef';

    public ?float $latitude = null;

    public ?float $longitude = null;

    public bool $needsPin = false;

    public string $geoMessage = '';

    public string $tier = 'all';

    public function updatedLocation(): void
    {
        $this->latitude = null;
        $this->longitude = null;
        $this->needsPin = false;
    }

    public function search(): void
    {
        if (trim($this->location) !== '' && ($this->latitude === null || $this->longitude === null)) {
            $parsed = Places::parse($this->location);
            $area = $parsed['area'] !== '' ? $parsed['area'] : $parsed['term'];
            $resolved = Places::resolve($parsed['city'], $area);

            if ($resolved['found']) {
                $this->latitude = $resolved['latitude'];
                $this->longitude = $resolved['longitude'];
                $this->needsPin = false;
            } else {
                $this->needsPin = true;

                return;
            }
        }

        Places::capture($this->location, $this->latitude, $this->longitude, auth()->id());
        $this->needsPin = false;
        $this->dispatch('filters-updated', filters: $this->filters());
    }

    public function chooseCategory(string $category): void
    {
        $this->category = $category;
        $this->search();
    }

    public function chooseService(string $service): void
    {
        $this->serviceType = $service;
        $this->search();
    }

    #[On('tier-changed')]
    public function syncTier(string $tier): void
    {
        $this->tier = $tier;
    }

    public function pin(float $latitude, float $longitude): void
    {
        $this->latitude = $latitude;
        $this->longitude = $longitude;
    }

    public function near(float $latitude, float $longitude): void
    {
        $this->latitude = $latitude;
        $this->longitude = $longitude;
        $this->geoMessage = '';

        $match = UgandaLocations::nearest($latitude, $longitude);

        if ($match) {
            $this->location = $match['area'].', '.$match['city'];
        }

        $this->search();
    }

    public function render()
    {
        return view('livewire.search.capsule-search', [
            'locations' => UgandaLocations::searchableMap(),
            'categories' => Escort::ORIENTATIONS,
            'services' => HomeServiceCatalog::searchServices(),
        ]);
    }

    /**
     * @return array<string, mixed>
     */
    private function filters(): array
    {
        return [
            'location' => $this->location,
            'category' => $this->category,
            'service_type' => $this->serviceType,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
        ];
    }
}

<?php

namespace App\Livewire\Search;

use App\Models\Escort;
use App\Support\HomeServiceCatalog;
use App\Support\UgandaLocations;
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

    public string $geoMessage = '';

    public function search(): void
    {
        $this->dispatch('filters-updated', filters: $this->filters());
    }

    public function near(float $latitude, float $longitude): void
    {
        $this->latitude = $latitude;
        $this->longitude = $longitude;
        $this->geoMessage = '';

        $match = UgandaLocations::nearest($latitude, $longitude);

        if ($match) {
            $this->location = $match['city'].'|'.$match['area'];
        }

        $this->search();
    }

    public function render()
    {
        return view('livewire.search.capsule-search', [
            'locations' => UgandaLocations::map(),
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

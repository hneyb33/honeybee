<?php

namespace App\Livewire\Search;

use Livewire\Attributes\Url;
use Livewire\Component;

class CapsuleSearch extends Component
{
    #[Url(as: 'q')]
    public string $location = '';

    #[Url(as: 'kind')]
    public string $kind = '';

    #[Url(as: 'service')]
    public string $serviceType = '';

    public ?float $latitude = null;

    public ?float $longitude = null;

    public function search(): void
    {
        $this->dispatch('filters-updated', filters: [
            'location' => $this->location,
            'kind' => $this->kind,
            'service_type' => $this->serviceType,
            'latitude' => $this->latitude,
            'longitude' => $this->longitude,
        ]);
    }

    public function render()
    {
        return view('livewire.search.capsule-search');
    }
}

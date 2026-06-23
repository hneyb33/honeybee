<?php

namespace App\Livewire\Search;

use Livewire\Attributes\Url;
use Livewire\Component;

class CapsuleSearch extends Component
{
    #[Url(as: 'q')]
    public string $location = '';

    #[Url(as: 'type')]
    public string $propertyType = '';

    #[Url(as: 'budget')]
    public string $budget = '';

    #[Url(as: 'move_in')]
    public ?string $moveInDate = null;

    public function search(): void
    {
        $this->dispatch('filters-updated', filters: [
            'location' => $this->location,
            'type' => $this->propertyType,
            'budget' => $this->budget,
            'moveInDate' => $this->moveInDate,
        ]);
    }

    public function render()
    {
        return view('livewire.search.capsule-search');
    }
}

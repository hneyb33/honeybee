<?php

namespace App\Livewire\Listings;

use Livewire\Component;

class TierFilter extends Component
{
    public string $activeTier = 'all';

    public function setTier(string $tier): void
    {
        $this->activeTier = $tier;
        $this->dispatch('tier-changed', tier: $tier);
    }

    public function render()
    {
        return view('livewire.listings.tier-filter');
    }
}

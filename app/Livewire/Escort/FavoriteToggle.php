<?php

namespace App\Livewire\Escort;

use App\Models\Escort;
use Livewire\Component;

class FavoriteToggle extends Component
{
    public Escort $escort;

    public bool $isFavorited = false;

    public bool $inline = false;

    public function mount(Escort $escort): void
    {
        $this->escort = $escort;
        $this->isFavorited = auth()->check()
            && auth()->user()->favorites()->where('escort_id', $escort->id)->exists();
    }

    public function toggle(): void
    {
        if (! auth()->check()) {
            $this->isFavorited = ! $this->isFavorited;
            $this->dispatch('favorite-previewed');

            return;
        }

        auth()->user()->favorites()->toggle($this->escort->id);
        $this->isFavorited = ! $this->isFavorited;
    }

    public function render()
    {
        return view('livewire.escort.favorite-toggle');
    }
}

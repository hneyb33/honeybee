<?php

namespace App\Livewire\Listings;

use Livewire\Component;

class TierFilter extends Component
{
    public string $activeTier = 'all';

    public function setTier(string $tier): void
    {
        if ($tier === 'vip' && ! $this->canBrowseVip()) {
            $user = auth()->user();

            if (! $user) {
                session()->put('url.intended', route('subscribe'));
                session()->flash('status', 'Log in to subscribe and browse VIP profiles.');
                $this->redirect(route('login'));

                return;
            }

            if ($user->isClient() || $user->isModel()) {
                session()->flash('status', $user->isModel()
                    ? 'Choose a VIP plan to list a VIP profile.'
                    : 'A subscription is required to browse VIP profiles.');
                $this->redirect(route('subscribe'));

                return;
            }
        }

        $this->activeTier = $tier;
        $this->dispatch('tier-changed', tier: $tier);
    }

    public function render()
    {
        return view('livewire.listings.tier-filter');
    }

    private function canBrowseVip(): bool
    {
        $user = auth()->user();

        return (bool) ($user?->isAdmin() || $user?->isPremiumClient());
    }
}

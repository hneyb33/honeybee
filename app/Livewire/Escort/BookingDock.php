<?php

namespace App\Livewire\Escort;

use App\Models\Escort;
use Livewire\Component;

class BookingDock extends Component
{
    public Escort $escort;

    public ?string $appointmentDate = null;

    public string $duration = '1';

    public string $experienceType = 'Incall';

    public bool $requested = false;

    public function getServiceFeeProperty(): int
    {
        return (int) round($this->escort->monthly_price * (int) $this->duration * 0.12);
    }

    public function getTotalProperty(): int
    {
        return (int) round($this->escort->monthly_price * (int) $this->duration + $this->serviceFee);
    }

    public function requestBooking(): void
    {
        $this->validate([
            'appointmentDate' => ['required', 'date', 'after:today'],
            'duration' => ['required', 'in:1,3,6'],
        ]);

        $this->requested = true;
    }

    public function render()
    {
        return view('livewire.escort.booking-dock');
    }
}

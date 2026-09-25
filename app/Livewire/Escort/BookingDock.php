<?php

namespace App\Livewire\Escort;

use App\Models\Booking;
use App\Models\Escort;
use App\Notifications\BookingRequested;
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
        return (int) round($this->escort->rateAmount() * (int) $this->duration * 0.12);
    }

    public function getTotalProperty(): int
    {
        return (int) round($this->escort->rateAmount() * (int) $this->duration + $this->serviceFee);
    }

    public function requestBooking(): void
    {
        $this->validate([
            'appointmentDate' => ['required', 'date', 'after:today'],
            'duration' => ['required', 'in:1,3,6'],
        ]);

        $user = auth()->user();

        if (! $user) {
            $this->redirect(route('login'));

            return;
        }

        abort_unless($user->isClient(), 403);
        abort_if($this->escort->isVip() && ! $user->isPremiumClient(), 403);

        $booking = Booking::create([
            'client_id' => $user->id,
            'escort_id' => $this->escort->id,
            'starts_at' => $this->appointmentDate.' 18:00:00',
            'duration_hours' => (int) $this->duration,
            'experience_type' => $this->experienceType,
            'status' => Booking::REQUESTED,
            'price_amount' => $this->total,
            'currency' => 'UGX',
        ]);

        $this->escort->owner?->notify(new BookingRequested($booking));

        $this->requested = true;
    }

    public function render()
    {
        return view('livewire.escort.booking-dock');
    }
}

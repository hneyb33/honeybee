<?php

namespace App\Policies;

use App\Models\Booking;
use App\Models\User;

class BookingPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, Booking $booking): bool
    {
        return $user->isAdmin() || $booking->client_id === $user->id || $booking->escort?->user_id === $user->id;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isClient();
    }

    public function delete(User $user, Booking $booking): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, Booking $booking): bool
    {
        return $user->isAdmin() || $booking->escort?->user_id === $user->id;
    }
}

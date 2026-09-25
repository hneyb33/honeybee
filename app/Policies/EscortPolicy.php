<?php

namespace App\Policies;

use App\Models\Escort;
use App\Models\User;

class EscortPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    public function view(User $user, Escort $escort): bool
    {
        return $user->isAdmin() || $escort->user_id === $user->id;
    }

    public function update(User $user, Escort $escort): bool
    {
        return $user->isAdmin() || ($user->isSpecialist() && $escort->user_id === $user->id);
    }

    public function create(User $user): bool
    {
        return $user->isAdmin() || $user->isSpecialist();
    }

    public function delete(User $user, Escort $escort): bool
    {
        return $user->isAdmin() || $escort->user_id === $user->id;
    }
}

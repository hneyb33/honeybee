<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

#[Fillable([
    'client_id',
    'escort_id',
    'starts_at',
    'duration_hours',
    'experience_type',
    'note',
    'status',
    'price_amount',
    'currency',
])]
class Booking extends Model
{
    public const REQUESTED = 'requested';

    public const ACCEPTED = 'accepted';

    public const DECLINED = 'declined';

    public const COMPLETED = 'completed';

    public const CANCELLED = 'cancelled';

    protected function casts(): array
    {
        return [
            'starts_at' => 'datetime',
            'duration_hours' => 'integer',
            'price_amount' => 'integer',
        ];
    }

    public function client(): BelongsTo
    {
        return $this->belongsTo(User::class, 'client_id');
    }

    public function escort(): BelongsTo
    {
        return $this->belongsTo(Escort::class);
    }

    public function review(): HasOne
    {
        return $this->hasOne(Review::class);
    }
}

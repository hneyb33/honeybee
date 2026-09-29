<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Str;

#[Fillable([
    'escort_id',
    'name',
    'phone',
    'relationship',
    'status',
    'verification_token',
    'verified_at',
])]
class EscortReference extends Model
{
    public const NOT_CONFIRMED = 'not_confirmed';

    public const CONFIRMED = 'confirmed';

    public const REJECTED = 'rejected';

    protected function casts(): array
    {
        return [
            'verified_at' => 'datetime',
        ];
    }

    protected static function booted(): void
    {
        static::creating(function (EscortReference $reference): void {
            $reference->verification_token ??= Str::random(40);
            $reference->status ??= self::NOT_CONFIRMED;
        });
    }

    public function escort(): BelongsTo
    {
        return $this->belongsTo(Escort::class);
    }

    public function relationshipLabel(): string
    {
        return \App\Support\HomeServiceCatalog::RELATIONSHIPS[$this->relationship] ?? (string) $this->relationship;
    }
}

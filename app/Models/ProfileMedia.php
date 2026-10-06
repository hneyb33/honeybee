<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Support\MediaFiles;

#[Fillable(['escort_id', 'path', 'kind', 'sort_order'])]
class ProfileMedia extends Model
{
    protected function casts(): array
    {
        return [
            'sort_order' => 'integer',
        ];
    }

    public function escort(): BelongsTo
    {
        return $this->belongsTo(Escort::class);
    }

    public function url(): string
    {
        return MediaFiles::url($this->path) ?? '';
    }
}

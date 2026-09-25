<?php

namespace App\Filament\Pages;

use App\Models\Setting;
use Filament\Pages\Page;

class Support extends Page
{
    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-lifebuoy';

    protected static ?string $navigationLabel = 'Support';

    protected static string|\UnitEnum|null $navigationGroup = 'Support';

    protected static ?string $title = 'Support';

    protected string $view = 'filament.pages.support';

    /** @var array<string, string> */
    public array $data = [];

    public function mount(): void
    {
        $this->data = Setting::bag([
            'privacy_policy',
            'terms',
            'complaints_telegram',
        ]);
    }

    public function save(): void
    {
        foreach ($this->data as $key => $value) {
            Setting::put($key, $value);
        }

        session()->flash('status', 'Support pages updated.');
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }
}

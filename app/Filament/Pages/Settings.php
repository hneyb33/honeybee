<?php

namespace App\Filament\Pages;

use App\Models\Setting;
use Filament\Pages\Page;

class Settings extends Page
{
    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-cog-6-tooth';

    protected static ?string $navigationLabel = 'Settings';

    protected static string|\UnitEnum|null $navigationGroup = 'Settings';

    protected static ?string $title = 'Settings';

    protected string $view = 'filament.pages.settings';

    /** @var array<string, string> */
    public array $data = [];

    public function mount(): void
    {
        $this->data = Setting::bag([
            'support_email',
            'mtn_momo_merchant_code',
            'airtel_money_merchant_code',
            'mobile_money_name',
            'mobile_money_number',
            'bank_name',
            'bank_account_name',
            'bank_account_number',
            'client_premium_daily_price',
            'client_premium_monthly_price',
            'specialist_daily_price',
            'specialist_monthly_price',
            'escort_premium_daily_price',
            'escort_premium_monthly_price',
            'escort_vip_daily_price',
            'escort_vip_monthly_price',
        ]);
    }

    public function save(): void
    {
        foreach ($this->data as $key => $value) {
            Setting::put($key, $value);
        }

        session()->flash('status', 'Settings saved. The subscription page and payment details use these values.');
    }

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }
}

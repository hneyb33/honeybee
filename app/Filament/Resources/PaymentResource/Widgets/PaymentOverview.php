<?php

namespace App\Filament\Resources\PaymentResource\Widgets;

use App\Enums\PaymentStatus;
use App\Models\Payment;
use Filament\Widgets\StatsOverviewWidget;
use Filament\Widgets\StatsOverviewWidget\Stat;

class PaymentOverview extends StatsOverviewWidget
{
    protected static bool $isDiscovered = false;

    protected static bool $isLazy = false;

    public static function canView(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    protected function getStats(): array
    {
        $verifiedToday = Payment::query()
            ->where('status', PaymentStatus::Verified)
            ->whereDate('verified_at', today());

        return [
            Stat::make('Pending verification', Payment::query()->where('status', PaymentStatus::Submitted)->count()),
            Stat::make('Verified today', (clone $verifiedToday)->count()),
            Stat::make('Rejected', Payment::query()->where('status', PaymentStatus::Rejected)->count()),
            Stat::make('Revenue today', 'UGX '.number_format((int) (clone $verifiedToday)->sum('amount'))),
        ];
    }
}

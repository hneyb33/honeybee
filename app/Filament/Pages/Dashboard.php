<?php

namespace App\Filament\Pages;

use App\Models\Booking;
use App\Models\Escort;
use App\Models\Payment;
use App\Models\ProfileMedia;
use Illuminate\Support\Collection;
use Filament\Pages\Dashboard as BaseDashboard;
use Filament\Schemas\Components\View;
use Filament\Schemas\Schema;

class Dashboard extends BaseDashboard
{
    protected static string $routePath = '/';

    protected static ?string $navigationLabel = 'Dashboard';

    protected static ?string $title = 'Dashboard';

    public function content(Schema $schema): Schema
    {
        return $schema->components([
            View::make('filament.pages.dashboard'),
        ]);
    }

    /**
     * @return array<string, int>
     */
    public function stats(): array
    {
        return [
            'models' => Escort::query()->where('kind', Escort::KIND_ESCORT)->count(),
            'providers' => Escort::query()->where('kind', Escort::KIND_SERVICE)->count(),
            'pending_profiles' => Escort::query()->where('verification_status', 'pending')->count(),
            'whatsapp' => Booking::query()->where('channel', Booking::CHANNEL_WHATSAPP)->count(),
            'telegram' => Booking::query()->where('channel', Booking::CHANNEL_TELEGRAM)->count(),
            'payments' => Payment::query()->where('status', 'submitted')->count(),
        ];
    }

    public function recentMedia(): Collection
    {
        return ProfileMedia::query()
            ->with('escort')
            ->latest('id')
            ->limit(12)
            ->get();
    }
}

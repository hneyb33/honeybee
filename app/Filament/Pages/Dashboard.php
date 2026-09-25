<?php

namespace App\Filament\Pages;

use App\Models\Booking;
use App\Models\Escort;
use App\Models\Payment;
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
            'booking_requests' => Booking::query()->where('status', Booking::REQUESTED)->count(),
            'orders' => Booking::query()->whereIn('status', [Booking::ACCEPTED, Booking::COMPLETED])->count(),
            'payments' => Payment::query()->where('status', 'pending')->count(),
        ];
    }
}

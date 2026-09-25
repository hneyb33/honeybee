<?php

namespace App\Filament\Resources\EscortResource\Pages;

use App\Filament\Resources\EscortResource;
use Filament\Actions;
use Filament\Resources\Pages\ListRecords;

class ListEscorts extends ListRecords
{
    protected static string $resource = EscortResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\CreateAction::make(),
        ];
    }
}

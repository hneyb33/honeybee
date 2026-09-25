<?php

namespace App\Filament\Resources\CatalogServiceResource\Pages;

use App\Filament\Resources\CatalogServiceResource;
use Filament\Actions\CreateAction;
use Filament\Resources\Pages\ListRecords;

class ListCatalogServices extends ListRecords
{
    protected static string $resource = CatalogServiceResource::class;

    protected function getHeaderActions(): array
    {
        return [CreateAction::make()];
    }
}

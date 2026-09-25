<?php

namespace App\Filament\Resources\CatalogServiceResource\Pages;

use App\Filament\Resources\CatalogServiceResource;
use Filament\Actions\DeleteAction;
use Filament\Resources\Pages\EditRecord;

class EditCatalogService extends EditRecord
{
    protected static string $resource = CatalogServiceResource::class;

    protected function getHeaderActions(): array
    {
        return [DeleteAction::make()];
    }
}

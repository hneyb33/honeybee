<?php

namespace App\Filament\Resources\ProviderResource\Pages;

use App\Filament\Resources\ProviderResource;
use Filament\Resources\Pages\CreateRecord;

class CreateProvider extends CreateRecord
{
    protected static string $resource = ProviderResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        return ProviderResource::prepareRecord($data);
    }
}

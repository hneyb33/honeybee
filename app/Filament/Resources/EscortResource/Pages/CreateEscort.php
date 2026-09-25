<?php

namespace App\Filament\Resources\EscortResource\Pages;

use App\Filament\Resources\EscortResource;
use Filament\Resources\Pages\CreateRecord;

class CreateEscort extends CreateRecord
{
    protected static string $resource = EscortResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        return EscortResource::prepareRecord($data);
    }
}

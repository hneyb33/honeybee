<?php

namespace App\Filament\Resources\EscortResource\Pages;

use App\Filament\Resources\EscortResource;
use Filament\Resources\Pages\EditRecord;
use Filament\Actions;

class EditEscort extends EditRecord
{
    protected static string $resource = EscortResource::class;

    protected function getHeaderActions(): array
    {
        return [
            Actions\DeleteAction::make(),
        ];
    }

    protected function mutateFormDataBeforeSave(array $data): array
    {
        $data['slug'] = $this->record->slug;

        return EscortResource::prepareRecord($data);
    }
}

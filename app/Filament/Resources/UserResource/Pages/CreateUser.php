<?php

namespace App\Filament\Resources\UserResource\Pages;

use App\Filament\Resources\UserResource;
use Filament\Resources\Pages\CreateRecord;

class CreateUser extends CreateRecord
{
    protected static string $resource = UserResource::class;

    protected function mutateFormDataBeforeCreate(array $data): array
    {
        unset($data['role']);

        return $data;
    }

    protected function afterCreate(): void
    {
        $role = $this->form->getState()['role'] ?? 'moderator';
        $this->record->assignRole($role);
    }
}

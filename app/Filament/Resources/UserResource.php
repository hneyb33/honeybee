<?php

namespace App\Filament\Resources;

use App\Filament\Resources\UserResource\Pages;
use App\Models\User;
use Filament\Actions\Action;
use Filament\Forms\Components\Select;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class UserResource extends Resource
{
    protected static ?string $model = User::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-shield-check';

    protected static ?string $navigationLabel = 'Promote admins';

    protected static ?string $modelLabel = 'user';

    protected static string|\UnitEnum|null $navigationGroup = 'Administration';

    protected static ?int $navigationSort = 1;

    public static function canAccess(): bool
    {
        return auth()->user()?->isSuperAdmin() ?? false;
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->with('roles');
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('name')->searchable(),
            Tables\Columns\TextColumn::make('email')->searchable(),
            Tables\Columns\TextColumn::make('account_kind')->label('Account')->badge(),
            Tables\Columns\TextColumn::make('roles.name')->label('Roles')->badge(),
        ])->recordActions([
            Action::make('promote')
                ->label('Set admin role')
                ->icon('heroicon-o-key')
                ->schema([
                    Select::make('role')
                        ->label('Admin access')
                        ->options([
                            'moderator' => 'Moderator',
                            'super_admin' => 'Super admin',
                            'none' => 'Remove admin access',
                        ])
                        ->required(),
                ])
                ->fillForm(fn (User $record): array => [
                    'role' => $record->isSuperAdmin() ? 'super_admin' : ($record->isAdmin() ? 'moderator' : 'none'),
                ])
                ->action(function (User $record, array $data): void {
                    if ($record->is(auth()->user()) && $data['role'] !== 'super_admin') {
                        return;
                    }

                    $record->removeRole('super_admin');
                    $record->removeRole('moderator');

                    if (in_array($data['role'], ['moderator', 'super_admin'], true)) {
                        $record->assignRole($data['role']);
                    }
                }),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListUsers::route('/'),
        ];
    }
}

<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProviderResource\Pages;
use App\Models\Escort;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Support\Str;

class ProviderResource extends Resource
{
    protected static ?string $model = Escort::class;

    protected static ?string $slug = 'providers';

    protected static ?string $navigationLabel = 'Service providers';

    protected static string|\UnitEnum|null $navigationGroup = 'Directory';

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-wrench-screwdriver';

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->where('kind', Escort::KIND_SERVICE);
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('user_id')->relationship('owner', 'email')->searchable()->required(),
            TextInput::make('title')->label('Display name')->required(),
            Select::make('service_type')->label('Service')->options(Escort::homeServices())->required(),
            TextInput::make('city')->required(),
            TextInput::make('hourly_rate')->numeric()->label('UGX per hour')->required(),
            Select::make('verification_status')->options([
                'pending' => 'Pending',
                'verified' => 'Verified',
                'rejected' => 'Rejected',
                'suspended' => 'Suspended',
            ])->required(),
            Textarea::make('description')->columnSpanFull(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('title')->searchable(),
            Tables\Columns\TextColumn::make('service_type'),
            Tables\Columns\TextColumn::make('verification_status')->badge(),
            Tables\Columns\TextColumn::make('city'),
        ])->recordActions([
            \Filament\Actions\Action::make('verify')
                ->color('success')
                ->visible(fn (Escort $record) => $record->verification_status !== Escort::VERIFIED)
                ->action(fn (Escort $record) => $record->update([
                    'verification_status' => Escort::VERIFIED,
                    'status' => 'published',
                ])),
            \Filament\Actions\Action::make('reject')
                ->color('danger')
                ->action(fn (Escort $record) => $record->update([
                    'verification_status' => 'rejected',
                    'status' => 'pending',
                ])),
            EditAction::make(),
            DeleteAction::make(),
        ]);
    }

    public static function prepareRecord(array $data): array
    {
        $data['kind'] = Escort::KIND_SERVICE;
        $data['category'] = 'service';
        $data['monthly_price'] = $data['hourly_rate'] ?? 0;
        $data['slug'] = $data['slug'] ?? Str::slug($data['title']).'-'.Str::lower(Str::random(4));
        $label = Escort::homeServices()[$data['service_type']] ?? $data['title'];
        $data['services_offered'] = [$label];

        return $data;
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListProviders::route('/'),
            'create' => Pages\CreateProvider::route('/create'),
            'edit' => Pages\EditProvider::route('/{record}/edit'),
        ];
    }
}

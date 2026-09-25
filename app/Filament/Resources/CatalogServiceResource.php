<?php

namespace App\Filament\Resources;

use App\Filament\Resources\CatalogServiceResource\Pages;
use App\Models\CatalogService;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class CatalogServiceResource extends Resource
{
    protected static ?string $model = CatalogService::class;

    protected static ?string $navigationLabel = 'Services';

    protected static string|\UnitEnum|null $navigationGroup = 'Settings';

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-queue-list';

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            TextInput::make('name')->required(),
            Select::make('group')->options([
                'escort' => 'Model service',
                'home' => 'Home service',
            ])->required(),
            Toggle::make('is_active')->default(true),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('name')->searchable(),
            Tables\Columns\TextColumn::make('group')->badge(),
            Tables\Columns\TextColumn::make('is_active')->badge(),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListCatalogServices::route('/'),
            'create' => Pages\CreateCatalogService::route('/create'),
            'edit' => Pages\EditCatalogService::route('/{record}/edit'),
        ];
    }
}

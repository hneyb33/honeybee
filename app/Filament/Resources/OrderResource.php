<?php

namespace App\Filament\Resources;

use App\Filament\Resources\OrderResource\Pages;
use App\Models\Booking;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Resources\Resource;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class OrderResource extends Resource
{
    protected static ?string $model = Booking::class;

    protected static ?string $slug = 'orders';

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-clipboard-document-check';

    protected static ?string $navigationLabel = 'Orders';

    protected static string|\UnitEnum|null $navigationGroup = 'Commerce';

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->whereIn('status', [
            Booking::ACCEPTED,
            Booking::COMPLETED,
            Booking::CANCELLED,
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('escort.title')->label('Profile')->searchable(),
                Tables\Columns\TextColumn::make('client.name')->label('Client')->searchable(),
                Tables\Columns\TextColumn::make('starts_at')->dateTime()->sortable(),
                Tables\Columns\TextColumn::make('status')->badge(),
                Tables\Columns\TextColumn::make('price_amount')->label('UGX'),
            ])
            ->recordActions([
                Action::make('complete')
                    ->action(fn (Booking $record) => $record->update(['status' => Booking::COMPLETED]))
                    ->visible(fn (Booking $record) => $record->status === Booking::ACCEPTED),
                Action::make('cancel')
                    ->action(fn (Booking $record) => $record->update(['status' => Booking::CANCELLED]))
                    ->visible(fn (Booking $record) => $record->status === Booking::ACCEPTED),
                DeleteAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListOrders::route('/'),
        ];
    }
}

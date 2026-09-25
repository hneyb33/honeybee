<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BookingResource\Pages;
use App\Models\Booking;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\DateTimePicker;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class BookingResource extends Resource
{
    protected static ?string $model = Booking::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-calendar';

    protected static ?string $navigationLabel = 'Booking requests';

    protected static string|\UnitEnum|null $navigationGroup = 'Commerce';

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->whereIn('status', [Booking::REQUESTED, Booking::DECLINED]);
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('client_id')->relationship('client', 'email')->searchable()->required(),
            Select::make('escort_id')->relationship('escort', 'title')->searchable()->required(),
            DateTimePicker::make('starts_at')->required(),
            TextInput::make('duration_hours')->numeric()->required(),
            TextInput::make('price_amount')->numeric()->label('UGX')->required(),
            Select::make('status')->options([
                Booking::REQUESTED => 'Requested',
                Booking::ACCEPTED => 'Accepted',
                Booking::DECLINED => 'Declined',
                Booking::COMPLETED => 'Completed',
                Booking::CANCELLED => 'Cancelled',
            ])->required(),
            Textarea::make('note')->columnSpanFull(),
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
                Action::make('accept')
                    ->action(fn (Booking $record) => $record->update(['status' => Booking::ACCEPTED]))
                    ->visible(fn (Booking $record) => $record->status === Booking::REQUESTED),
                Action::make('decline')
                    ->action(fn (Booking $record) => $record->update(['status' => Booking::DECLINED]))
                    ->visible(fn (Booking $record) => $record->status === Booking::REQUESTED),
                EditAction::make(),
                DeleteAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListBookings::route('/'),
            'edit' => Pages\EditBooking::route('/{record}/edit'),
        ];
    }
}

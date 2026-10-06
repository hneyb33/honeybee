<?php

namespace App\Filament\Resources;

use App\Filament\Resources\BookingResource\Pages;
use App\Models\Booking;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;

class BookingResource extends Resource
{
    protected static ?string $model = Booking::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-calendar';

    protected static ?string $navigationLabel = 'Bookings';

    protected static string|\UnitEnum|null $navigationGroup = 'Commerce';

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()->latest();
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('client_id')->relationship('client', 'email')->searchable()->required(),
            Select::make('escort_id')->relationship('escort', 'title')->searchable()->required(),
            Select::make('channel')->options([
                Booking::CHANNEL_WHATSAPP => 'WhatsApp',
                Booking::CHANNEL_TELEGRAM => 'Telegram',
            ])->required(),
            Select::make('status')->options([
                Booking::CONTACTED => 'Contacted',
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
                Tables\Columns\TextColumn::make('channel')
                    ->label('Channel')
                    ->badge()
                    ->formatStateUsing(fn (?string $state): string => match ($state) {
                        Booking::CHANNEL_WHATSAPP => 'WhatsApp',
                        Booking::CHANNEL_TELEGRAM => 'Telegram',
                        default => 'Not set',
                    })
                    ->color(fn (?string $state): string => match ($state) {
                        Booking::CHANNEL_WHATSAPP => 'success',
                        Booking::CHANNEL_TELEGRAM => 'info',
                        default => 'gray',
                    }),
                Tables\Columns\TextColumn::make('escort.kind')->label('Profile type')->badge(),
                Tables\Columns\TextColumn::make('created_at')->label('Contacted')->dateTime()->sortable(),
                Tables\Columns\TextColumn::make('status')->badge(),
            ])
            ->recordActions([
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

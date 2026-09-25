<?php

namespace App\Filament\Resources;

use App\Filament\Resources\PaymentResource\Pages;
use App\Models\Payment;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class PaymentResource extends Resource
{
    protected static ?string $model = Payment::class;

    protected static ?string $navigationLabel = 'Payments';

    protected static string|\UnitEnum|null $navigationGroup = 'Commerce';

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-banknotes';

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('user_id')->relationship('user', 'email')->searchable()->required(),
            TextInput::make('amount')->numeric()->required(),
            Select::make('method')->options([
                'mobile_money' => 'Mobile money',
                'bank' => 'Bank account',
            ])->required(),
            Select::make('status')->options([
                'pending' => 'Pending',
                'approved' => 'Approved',
                'rejected' => 'Rejected',
            ])->required(),
            TextInput::make('reference'),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('user.email')->searchable(),
            Tables\Columns\TextColumn::make('amount')->label('UGX'),
            Tables\Columns\TextColumn::make('method'),
            Tables\Columns\TextColumn::make('status')->badge(),
            Tables\Columns\TextColumn::make('reference'),
        ])->recordActions([
            Action::make('approve')
                ->color('success')
                ->visible(fn (Payment $record) => $record->status === 'pending')
                ->action(function (Payment $record) {
                    $record->update(['status' => 'approved']);
                    $subscription = $record->subscription;
                    if ($subscription) {
                        $subscription->update(['status' => 'active']);
                    }
                }),
            Action::make('reject')
                ->color('danger')
                ->visible(fn (Payment $record) => $record->status === 'pending')
                ->action(fn (Payment $record) => $record->update(['status' => 'rejected'])),
            EditAction::make(),
            DeleteAction::make(),
        ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPayments::route('/'),
            'create' => Pages\CreatePayment::route('/create'),
            'edit' => Pages\EditPayment::route('/{record}/edit'),
        ];
    }
}

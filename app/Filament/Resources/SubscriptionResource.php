<?php

namespace App\Filament\Resources;

use App\Filament\Resources\SubscriptionResource\Pages;
use App\Models\Setting;
use App\Models\Subscription;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;

class SubscriptionResource extends Resource
{
    protected static ?string $model = Subscription::class;

    protected static ?string $navigationLabel = 'Subscriptions';

    protected static string|\UnitEnum|null $navigationGroup = 'Settings';

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-credit-card';

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('user_id')->relationship('user', 'email')->searchable()->required(),
            Select::make('plan')->options([
                'specialist' => 'Specialist',
                'client_premium' => 'Client premium',
            ])->required(),
            Select::make('period')->options([
                'daily' => 'Daily',
                'monthly' => 'Monthly',
                'yearly' => 'Yearly',
                'custom' => 'Custom',
            ])->required(),
            TextInput::make('custom_days')->numeric()->label('Custom days'),
            TextInput::make('price_amount')->numeric()->label('Price (UGX)')->required(),
            Select::make('status')->options([
                'pending' => 'Pending',
                'active' => 'Active',
                'cancelled' => 'Cancelled',
            ])->required(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('user.email')->label('Account')->searchable(),
            Tables\Columns\TextColumn::make('plan'),
            Tables\Columns\TextColumn::make('period')->badge(),
            Tables\Columns\TextColumn::make('price_amount')->label('UGX'),
            Tables\Columns\TextColumn::make('status')->badge(),
            Tables\Columns\TextColumn::make('ends_at')->dateTime(),
        ]);
    }

    public static function applyPeriod(array $data): array
    {
        $period = $data['period'] ?? 'monthly';
        $customDays = (int) ($data['custom_days'] ?: Setting::get(($data['plan'] ?? 'specialist').'_custom_days', 30));
        $data['starts_at'] = $data['starts_at'] ?? now();
        $data['ends_at'] = match ($period) {
            'daily' => now()->addDay(),
            'yearly' => now()->addYear(),
            'custom' => now()->addDays(max($customDays, 1)),
            default => now()->addMonth(),
        };
        $data['custom_days'] = $period === 'custom' ? $customDays : null;

        if (empty($data['price_amount']) && ! empty($data['plan'])) {
            $data['price_amount'] = (int) Setting::get($data['plan'].'_'.$period.'_price', 0);
        }

        return $data;
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListSubscriptions::route('/'),
            'create' => Pages\CreateSubscription::route('/create'),
            'edit' => Pages\EditSubscription::route('/{record}/edit'),
        ];
    }
}

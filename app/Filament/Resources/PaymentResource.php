<?php

namespace App\Filament\Resources;

use App\Enums\PaymentProvider;
use App\Enums\PaymentStatus;
use App\Filament\Resources\PaymentResource\Pages;
use App\Models\Payment;
use Filament\Actions\ViewAction;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Text;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Filters\SelectFilter;
use Filament\Tables\Table;

class PaymentResource extends Resource
{
    protected static ?string $model = Payment::class;

    protected static ?string $navigationLabel = 'Payments';

    protected static ?string $recordTitleAttribute = 'reference';

    protected static string|\UnitEnum|null $navigationGroup = 'Commerce';

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-banknotes';

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    public static function canCreate(): bool
    {
        return false;
    }

    public static function getNavigationBadge(): ?string
    {
        $count = Payment::query()->where('status', PaymentStatus::Submitted)->count();

        return $count > 0 ? (string) $count : null;
    }

    public static function infolist(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Client')->components([
                Text::make(fn (Text $component) => 'Name: '.($component->getRecord()->user?->name ?? '—')),
                Text::make(fn (Text $component) => 'Email: '.($component->getRecord()->user?->email ?? '—')),
                Text::make(function (Text $component) {
                    $profiles = $component->getRecord()->user?->escorts ?? collect();

                    if ($profiles->isEmpty()) {
                        return 'Profile: no profile yet';
                    }

                    return 'Profile: '.$profiles->map(function ($profile) {
                        $status = str_replace('_', ' ', (string) $profile->verification_status);

                        return $profile->title.' ('.$status.')';
                    })->join(', ');
                }),
            ]),
            Section::make('Subscription request')->components([
                Text::make(fn (Text $component) => 'Plan: '.$component->getRecord()->planLabel()),
                Text::make(fn (Text $component) => 'Price: UGX '.number_format($component->getRecord()->amount)),
                Text::make(fn (Text $component) => 'Duration: '.$component->getRecord()->durationLabel()),
                Text::make(fn (Text $component) => 'Reference: '.($component->getRecord()->reference ?: '—'))->copyable(),
            ]),
            Section::make('Payment claim')->components([
                Text::make(fn (Text $component) => 'Provider: '.($component->getRecord()->provider?->label() ?? '—')),
                Text::make(fn (Text $component) => 'Merchant: '.($component->getRecord()->merchant_code ?: '—')),
                Text::make(fn (Text $component) => 'Phone: '.Payment::displayPhone($component->getRecord()->payer_phone)),
                Text::make(fn (Text $component) => 'Transaction: '.($component->getRecord()->transaction_id ?: '—'))->copyable(),
                Text::make(fn (Text $component) => 'Amount: UGX '.number_format($component->getRecord()->amount)),
                Text::make(fn (Text $component) => 'Paid: '.($component->getRecord()->paid_at?->format('j M Y, g:i A') ?: '—')),
                Text::make(fn (Text $component) => 'Status: '.$component->getRecord()->status->label()),
                Text::make(fn (Text $component) => $component->getRecord()->rejection_reason
                    ? 'Rejection: '.$component->getRecord()->rejection_reason
                    : 'Proof stays private. Open the screenshot from the header when one was uploaded.'),
            ]),
            Section::make('Audit')->components([
                Text::make(function (Text $component) {
                    $audits = $component->getRecord()->audits;

                    if ($audits->isEmpty()) {
                        return 'No audit entries yet.';
                    }

                    return $audits->map(function ($audit) {
                        $who = $audit->admin?->email ?? 'Client';

                        return $audit->created_at?->format('j M Y, g:i A').' · '.$who.' · '.$audit->action.' · '.$audit->notes;
                    })->join("\n");
                }),
            ]),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('user.name')->label('Client')->searchable(),
                Tables\Columns\TextColumn::make('plan')
                    ->formatStateUsing(fn (?string $state, Payment $record) => $record->planLabel()),
                Tables\Columns\TextColumn::make('provider')
                    ->label('Network')
                    ->formatStateUsing(fn (PaymentProvider|string|null $state) => $state instanceof PaymentProvider ? $state->label() : '—'),
                Tables\Columns\TextColumn::make('amount')->label('Amount')->numeric(),
                Tables\Columns\TextColumn::make('payer_phone')
                    ->label('Phone')
                    ->formatStateUsing(fn (?string $state) => Payment::displayPhone($state)),
                Tables\Columns\TextColumn::make('transaction_id')->label('Transaction')->searchable(),
                Tables\Columns\TextColumn::make('submitted_at')->label('Submitted')->dateTime('H:i')->placeholder('—'),
                Tables\Columns\TextColumn::make('status')
                    ->badge()
                    ->formatStateUsing(fn (PaymentStatus|string|null $state) => $state instanceof PaymentStatus ? $state->label() : (string) $state)
                    ->color(fn (PaymentStatus|string|null $state) => $state instanceof PaymentStatus ? $state->color() : 'gray'),
            ])
            ->filters([
                SelectFilter::make('status')->options(collect(PaymentStatus::cases())->mapWithKeys(
                    fn (PaymentStatus $status) => [$status->value => $status->label()]
                )->all()),
            ])
            ->defaultSort('created_at', 'desc')
            ->recordActions([
                ViewAction::make(),
            ]);
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListPayments::route('/'),
            'view' => Pages\ViewPayment::route('/{record}'),
        ];
    }
}

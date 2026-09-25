<?php

namespace App\Filament\Resources;

use App\Filament\Resources\EscortResource\Pages;
use App\Models\Escort;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\CheckboxList;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Support\Str;

class EscortResource extends Resource
{
    protected static ?string $model = Escort::class;

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-user-group';

    protected static ?string $navigationLabel = 'Models';

    protected static string|\UnitEnum|null $navigationGroup = 'Directory';

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    public static function getEloquentQuery(): \Illuminate\Database\Eloquent\Builder
    {
        return parent::getEloquentQuery()->where('kind', Escort::KIND_ESCORT);
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Select::make('user_id')->relationship('owner', 'email')->searchable()->required(),
            TextInput::make('title')->required()->maxLength(255),
            Select::make('escort_tier')->options([
                Escort::TIER_VIP => 'VIP',
                Escort::TIER_PREMIUM => 'Premium',
            ])->required(),
            Select::make('build')->options(array_combine(Escort::BODY_TYPES, Escort::BODY_TYPES)),
            Select::make('sexual_orientation')->options(array_combine(Escort::ORIENTATIONS, Escort::ORIENTATIONS)),
            TextInput::make('city')->required(),
            TextInput::make('neighborhood'),
            TextInput::make('hourly_rate')->numeric()->label('UGX per hour')->required(),
            TextInput::make('phone'),
            TextInput::make('whatsapp_number'),
            TextInput::make('telegram'),
            CheckboxList::make('services_offered')->options(array_combine(Escort::offeredServices(), Escort::offeredServices()))->columns(2),
            Select::make('verification_status')->options([
                'pending' => 'Pending',
                'under_review' => 'Under Review',
                'verified' => 'Verified',
                'rejected' => 'Rejected',
                'suspended' => 'Suspended',
            ])->required(),
            Textarea::make('description')->columnSpanFull(),
            Textarea::make('verification_notes')->columnSpanFull(),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table
            ->columns([
                Tables\Columns\TextColumn::make('title')->searchable()->sortable(),
                Tables\Columns\TextColumn::make('escort_tier')->badge(),
                Tables\Columns\TextColumn::make('verification_status')->badge()->sortable(),
                Tables\Columns\TextColumn::make('city')->searchable(),
                Tables\Columns\TextColumn::make('hourly_rate')->label('UGX/hour'),
            ])
            ->recordActions([
                \Filament\Actions\Action::make('verify')
                    ->color('success')
                    ->visible(fn (Escort $record) => $record->verification_status !== Escort::VERIFIED)
                    ->action(fn (Escort $record) => $record->update([
                        'verification_status' => Escort::VERIFIED,
                        'status' => 'published',
                    ])),
                \Filament\Actions\Action::make('reject')
                    ->color('danger')
                    ->visible(fn (Escort $record) => $record->verification_status !== 'rejected')
                    ->action(fn (Escort $record) => $record->update([
                        'verification_status' => 'rejected',
                        'status' => 'pending',
                    ])),
                EditAction::make(),
                DeleteAction::make(),
            ])
            ->toolbarActions([
                BulkActionGroup::make([
                    DeleteBulkAction::make(),
                ]),
            ]);
    }

    public static function prepareRecord(array $data): array
    {
        $data['kind'] = Escort::KIND_ESCORT;
        $data['category'] = 'escort';
        $data['tier'] = $data['escort_tier'] ?? Escort::TIER_PREMIUM;
        $data['monthly_price'] = $data['hourly_rate'] ?? 0;
        $data['slug'] = $data['slug'] ?? Str::slug($data['title']).'-'.Str::lower(Str::random(4));

        return $data;
    }

    public static function getPages(): array
    {
        return [
            'index' => Pages\ListEscorts::route('/'),
            'create' => Pages\CreateEscort::route('/create'),
            'edit' => Pages\EditEscort::route('/{record}/edit'),
        ];
    }
}

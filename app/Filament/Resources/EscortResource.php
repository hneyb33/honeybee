<?php

namespace App\Filament\Resources;

use App\Filament\Resources\EscortResource\Pages;
use App\Filament\Support\ProfileMediaReview;
use App\Models\Escort;
use Filament\Actions\Action;
use Filament\Actions\BulkActionGroup;
use Filament\Actions\DeleteAction;
use Filament\Actions\DeleteBulkAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\CheckboxList;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\ViewField;
use Filament\Resources\Resource;
use Filament\Schemas\Schema;
use Filament\Tables;
use Filament\Tables\Table;
use Illuminate\Database\Eloquent\Builder;
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

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->where('kind', Escort::KIND_ESCORT)
            ->withCount([
                'media as photos_count' => fn (Builder $query) => $query->where('kind', '!=', 'video'),
                'media as videos_count' => fn (Builder $query) => $query->where('kind', 'video'),
            ]);
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            ProfileMediaReview::section(),
            Select::make('user_id')->relationship('owner', 'email')->searchable()->required(),
            TextInput::make('title')->required()->maxLength(255),
            Select::make('escort_tier')->options([
                Escort::TIER_VIP => 'VIP',
                Escort::TIER_PREMIUM => 'Premium',
            ])->required(),
            Select::make('build')->options(array_combine(Escort::BODY_TYPES, Escort::BODY_TYPES)),
            Select::make('sexual_orientation')->options(array_combine(Escort::ORIENTATIONS, Escort::ORIENTATIONS)),
            Select::make('nationality')->options(array_combine(Escort::NATIONALITIES, Escort::NATIONALITIES))->searchable(),
            TextInput::make('city')
                ->required()
                ->maxLength(80)
                ->live(onBlur: true),
            TextInput::make('neighborhood')
                ->label('Exact location')
                ->required()
                ->maxLength(120)
                ->live(onBlur: true)
                ->helperText('Type a listed area or the exact place. A map pin appears only if that place cannot be found.'),
            Hidden::make('latitude'),
            Hidden::make('longitude'),
            ViewField::make('location_pin')
                ->hiddenLabel()
                ->view('filament.forms.location-pin')
                ->dehydrated(false)
                ->columnSpanFull(),
            CheckboxList::make('languages')
                ->options(array_combine(Escort::LANGUAGES, Escort::LANGUAGES))
                ->columns(2)
                ->formatStateUsing(function ($state): array {
                    if (! is_array($state) || $state === []) {
                        return [];
                    }

                    return array_is_list($state) ? array_values($state) : array_keys($state);
                }),
            TextInput::make('hourly_rate')->numeric()->label('UGX per hour')->required(),
            TextInput::make('phone'),
            Select::make('whatsapp_code')->options(Escort::DIAL_CODES)->default('+256'),
            TextInput::make('whatsapp_number'),
            Select::make('telegram_code')->options(Escort::DIAL_CODES)->default('+256'),
            TextInput::make('telegram')->label('Telegram number'),
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
                Tables\Columns\TextColumn::make('media_summary')
                    ->label('Media')
                    ->state(fn (Escort $record): string => ((int) $record->photos_count).' photos, '.((int) $record->videos_count).' '.((int) $record->videos_count === 1 ? 'video' : 'videos')),
                Tables\Columns\TextColumn::make('nationality')->toggleable(),
                Tables\Columns\TextColumn::make('city')->searchable(),
                Tables\Columns\TextColumn::make('neighborhood')->label('Area')->searchable(),
                Tables\Columns\TextColumn::make('whatsapp_number')
                    ->label('WhatsApp')
                    ->formatStateUsing(fn ($state, Escort $record): string => trim(($record->whatsapp_code ?: '+256').' '.$state)),
                Tables\Columns\TextColumn::make('hourly_rate')->label('UGX/hour'),
            ])
            ->recordActions([
                ProfileMediaReview::action(),
                Action::make('verify')
                    ->color('success')
                    ->visible(fn (Escort $record) => $record->verification_status !== Escort::VERIFIED)
                    ->action(fn (Escort $record) => $record->update([
                        'verification_status' => Escort::VERIFIED,
                        'status' => 'published',
                    ])),
                Action::make('reject')
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

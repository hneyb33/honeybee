<?php

namespace App\Filament\Resources;

use App\Filament\Resources\ProviderResource\Pages;
use App\Filament\Support\ProfileMediaReview;
use App\Models\Escort;
use App\Models\EscortReference;
use App\Support\HomeServiceCatalog;
use App\Support\UgandaLocations;
use Filament\Actions\Action;
use Filament\Actions\DeleteAction;
use Filament\Actions\EditAction;
use Filament\Forms\Components\CheckboxList;
use Filament\Forms\Components\FileUpload;
use Filament\Forms\Components\Hidden;
use Filament\Forms\Components\Placeholder;
use Filament\Forms\Components\Repeater;
use Filament\Forms\Components\Select;
use Filament\Forms\Components\Textarea;
use Filament\Forms\Components\TextInput;
use Filament\Forms\Components\Toggle;
use Filament\Resources\Resource;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\Utilities\Get;
use Filament\Schemas\Components\Utilities\Set;
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

    protected static ?string $modelLabel = 'Service provider';

    protected static ?string $pluralModelLabel = 'Service providers';

    protected static string|\UnitEnum|null $navigationGroup = 'Directory';

    protected static string|\BackedEnum|null $navigationIcon = 'heroicon-o-wrench-screwdriver';

    public static function canAccess(): bool
    {
        return auth()->user()?->isAdmin() ?? false;
    }

    public static function getEloquentQuery(): Builder
    {
        return parent::getEloquentQuery()
            ->where('kind', Escort::KIND_SERVICE)
            ->withCount([
                'media as photos_count' => fn (Builder $query) => $query->where('kind', '!=', 'video'),
                'media as videos_count' => fn (Builder $query) => $query->where('kind', 'video'),
            ]);
    }

    public static function form(Schema $schema): Schema
    {
        return $schema->components([
            Section::make('Profile')->components([
                Select::make('user_id')->relationship('owner', 'email')->searchable()->required(),
                TextInput::make('title')->label('Display name')->required(),
                Select::make('service_type')
                    ->label('Occupation')
                    ->options(HomeServiceCatalog::OCCUPATIONS)
                    ->live()
                    ->required(),
                TextInput::make('occupation')
                    ->label('Other occupation')
                    ->visible(fn (Get $get): bool => $get('service_type') === 'other')
                    ->required(fn (Get $get): bool => $get('service_type') === 'other'),
                Select::make('nationality')->options(array_combine(Escort::NATIONALITIES, Escort::NATIONALITIES))->searchable(),
                Select::make('gender')->options([
                    'female' => 'Female',
                    'male' => 'Male',
                ]),
                Select::make('city')
                    ->options(fn (): array => array_combine(UgandaLocations::cities(), UgandaLocations::cities()))
                    ->searchable()
                    ->live()
                    ->required()
                    ->afterStateUpdated(fn (Set $set) => $set('neighborhood', null)),
                Select::make('neighborhood')
                    ->label('Area')
                    ->options(function (Get $get): array {
                        $areas = UgandaLocations::areas((string) ($get('city') ?: 'Kampala'));

                        return array_combine($areas, $areas);
                    })
                    ->searchable()
                    ->required(),
                Select::make('travel_km')->label('Travel')->options([
                    '5' => '5 km',
                    '10' => '10 km',
                    '20' => '20 km',
                    '50' => '50 km',
                    'anywhere' => 'Anywhere',
                ]),
                CheckboxList::make('languages')
                    ->options(array_combine(Escort::LANGUAGES, Escort::LANGUAGES))
                    ->columns(2)
                    ->columnSpanFull()
                    ->formatStateUsing(function ($state): array {
                        if (! is_array($state) || $state === []) {
                            return [];
                        }

                        return array_is_list($state) ? array_values($state) : array_keys($state);
                    }),
                TextInput::make('phone'),
                Select::make('whatsapp_code')->options(Escort::DIAL_CODES)->default('+256'),
                TextInput::make('whatsapp_number')->required(),
                Select::make('telegram_code')->options(Escort::DIAL_CODES)->default('+256'),
                TextInput::make('telegram')->label('Telegram number'),
                Textarea::make('description')->label('Introduction')->required()->columnSpanFull(),
            ])->columns(2),
            Section::make('Experience')->components([
                Select::make('experience_band')
                    ->label('How long')
                    ->options(HomeServiceCatalog::EXPERIENCE),
                CheckboxList::make('learning_methods')
                    ->label('How they learned')
                    ->options(HomeServiceCatalog::LEARNING)
                    ->columns(2)
                    ->columnSpanFull(),
                Toggle::make('has_certificate')->label('Has a training certificate'),
                Select::make('certificate_type')
                    ->options(HomeServiceCatalog::CERTIFICATES)
                    ->visible(fn (Get $get): bool => (bool) $get('has_certificate')),
                FileUpload::make('certificate_path')
                    ->label('Certificate photo')
                    ->disk('public')
                    ->directory('certificates')
                    ->image()
                    ->visible(fn (Get $get): bool => (bool) $get('has_certificate')),
            ])->columns(2),
            Section::make('Services and prices')->components([
                Repeater::make('offerings')
                    ->relationship()
                    ->defaultItems(0)
                    ->orderColumn('sort_order')
                    ->components([
                        TextInput::make('name')->required(),
                        TextInput::make('group_name')->label('Group'),
                        TextInput::make('service_key')->label('Key'),
                        TextInput::make('price')->numeric()->prefix('UGX')->required(),
                        Select::make('pricing_unit')->options([
                            'session' => 'Per session',
                            'person' => 'Per person',
                            'day' => 'Per day',
                            'hour' => 'Per hour',
                            '60' => '60 minutes',
                            '90' => '90 minutes',
                            '120' => '120 minutes',
                            'kg' => 'Per kilogram',
                            'item' => 'Per item',
                            'load' => 'Per load',
                            'package' => 'Per package',
                            'quote' => 'Quote',
                        ])->required(),
                        Select::make('service_location')->label('Where')->options(HomeServiceCatalog::LOCATIONS)->required(),
                        TextInput::make('turnaround'),
                        Toggle::make('is_addon')->label('Add-on'),
                    ])
                    ->columns(2)
                    ->columnSpanFull(),
            ]),
            Section::make('Availability')->components(self::scheduleFields())->columns(3),
            Section::make('References')->components([
                Repeater::make('references')
                    ->relationship()
                    ->defaultItems(0)
                    ->components([
                        TextInput::make('name')->required(),
                        TextInput::make('phone')->tel()->required(),
                        Select::make('relationship')->options(HomeServiceCatalog::RELATIONSHIPS)->required(),
                        Select::make('status')->options([
                            EscortReference::NOT_CONFIRMED => 'Not confirmed',
                            EscortReference::CONFIRMED => 'Confirmed',
                            EscortReference::REJECTED => 'Rejected',
                        ])->required()->default(EscortReference::NOT_CONFIRMED),
                        Hidden::make('verification_token')->dehydrated(false),
                        Placeholder::make('confirm_link')
                            ->label('Confirmation link')
                            ->content(function (Get $get): string {
                                $token = $get('verification_token');

                                return $token ? url('/references/'.$token) : 'The link appears after this reference is saved.';
                            })
                            ->columnSpanFull(),
                    ])
                    ->columns(2)
                    ->columnSpanFull(),
                Placeholder::make('private_identity')
                    ->label('Private identity')
                    ->content(function (?Escort $record): string {
                        $trust = $record?->onboarding_data['trust'] ?? [];
                        $name = $trust['legal_name'] ?? 'Not provided';
                        $dob = $trust['date_of_birth'] ?? 'Not provided';

                        return 'Legal name: '.$name.'. Date of birth: '.$dob.'.';
                    })
                    ->columnSpanFull(),
            ]),
            ProfileMediaReview::section(),
            Section::make('Verification')->components([
                Select::make('verification_status')->options([
                    'pending' => 'Pending',
                    'under_review' => 'Under Review',
                    'verified' => 'Verified',
                    'rejected' => 'Rejected',
                    'suspended' => 'Suspended',
                ])->required(),
                Textarea::make('verification_notes')->columnSpanFull(),
            ])->columns(2),
        ]);
    }

    public static function table(Table $table): Table
    {
        return $table->columns([
            Tables\Columns\TextColumn::make('title')->searchable(),
            Tables\Columns\TextColumn::make('occupation')->label('Occupation'),
            Tables\Columns\TextColumn::make('city'),
            Tables\Columns\TextColumn::make('neighborhood')->label('Area'),
            Tables\Columns\TextColumn::make('whatsapp_number')
                ->label('WhatsApp')
                ->formatStateUsing(fn ($state, Escort $record): string => trim(($record->whatsapp_code ?: '+256').' '.$state)),
            Tables\Columns\TextColumn::make('verification_status')->badge(),
            Tables\Columns\TextColumn::make('media_summary')
                ->label('Media')
                ->state(fn (Escort $record): string => ((int) $record->photos_count).' photos, '.((int) $record->videos_count).' '.((int) $record->videos_count === 1 ? 'video' : 'videos')),
        ])->recordActions([
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
                ->action(fn (Escort $record) => $record->update([
                    'verification_status' => 'rejected',
                    'status' => 'pending',
                ])),
            EditAction::make(),
            DeleteAction::make(),
        ]);
    }

    /**
     * @return array<int, Toggle|TextInput>
     */
    private static function scheduleFields(): array
    {
        $fields = [];

        foreach (HomeServiceCatalog::DAYS as $key => $label) {
            $fields[] = Toggle::make('weekly_hours.'.$key.'.on')->label($label);
            $fields[] = TextInput::make('weekly_hours.'.$key.'.from')->label($label.' from')->placeholder('08:00');
            $fields[] = TextInput::make('weekly_hours.'.$key.'.to')->label($label.' to')->placeholder('17:00');
        }

        return $fields;
    }

    public static function prepareRecord(array $data): array
    {
        $data['kind'] = Escort::KIND_SERVICE;
        $data['category'] = 'service';
        $data['tier'] = $data['tier'] ?? 'premium';
        $data['monthly_price'] = $data['hourly_rate'] ?? $data['monthly_price'] ?? 0;
        $data['slug'] = $data['slug'] ?? Str::slug($data['title']).'-'.Str::lower(Str::random(4));

        if (($data['service_type'] ?? null) && $data['service_type'] !== 'other') {
            $data['occupation'] = HomeServiceCatalog::OCCUPATIONS[$data['service_type']] ?? ($data['occupation'] ?? null);
        }

        return $data;
    }

    public static function syncServices(Escort $record): void
    {
        $names = $record->offerings()->orderBy('sort_order')->pluck('name')->filter()->values()->all();

        if ($names !== []) {
            $record->update(['services_offered' => $names]);
        }
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

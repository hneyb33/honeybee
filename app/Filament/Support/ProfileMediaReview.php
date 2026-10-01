<?php

namespace App\Filament\Support;

use App\Models\Escort;
use Filament\Actions\Action;
use Filament\Notifications\Notification;
use Filament\Schemas\Components\Section;
use Filament\Schemas\Components\View;
use Filament\Support\Enums\Width;
use Illuminate\Support\Collection;

class ProfileMediaReview
{
    public static function section(): Section
    {
        return Section::make('Submitted photos and videos')
            ->description('Review these files before you approve or reject the profile.')
            ->visible(fn (?Escort $record): bool => $record !== null)
            ->columnSpanFull()
            ->components([
                View::make('filament.profiles.verification-media')
                    ->viewData(fn (?Escort $record): array => [
                        'media' => $record?->media ?? new Collection,
                    ])
                    ->columnSpanFull(),
            ]);
    }

    public static function action(): Action
    {
        return Action::make('reviewMedia')
            ->label('Photos & video')
            ->icon('heroicon-o-photo')
            ->modalHeading(fn (Escort $record): string => $record->title)
            ->modalDescription('Review the photos and video submitted for verification, then approve or reject the profile.')
            ->modalContent(fn (Escort $record) => view('filament.profiles.verification-media', [
                'media' => $record->media()->orderBy('sort_order')->get(),
            ]))
            ->modalWidth(Width::FiveExtraLarge)
            ->modalSubmitAction(false)
            ->modalCancelActionLabel('Close')
            ->extraModalFooterActions([
                Action::make('approveProfile')
                    ->label('Approve')
                    ->color('success')
                    ->visible(fn (Escort $record): bool => $record->verification_status !== Escort::VERIFIED)
                    ->action(function (Escort $record): void {
                        $record->update([
                            'verification_status' => Escort::VERIFIED,
                            'status' => 'published',
                        ]);

                        Notification::make()->title('Profile approved')->success()->send();
                    }),
                Action::make('rejectProfile')
                    ->label('Reject')
                    ->color('danger')
                    ->visible(fn (Escort $record): bool => $record->verification_status !== 'rejected')
                    ->action(function (Escort $record): void {
                        $record->update([
                            'verification_status' => 'rejected',
                            'status' => 'pending',
                        ]);

                        Notification::make()->title('Profile rejected')->success()->send();
                    }),
            ]);
    }
}

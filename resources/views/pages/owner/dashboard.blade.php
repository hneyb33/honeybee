@extends('layouts.app')

@section('content')
<div class="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
    <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div class="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-sm font-semibold uppercase tracking-[0.2em] text-purple-600">Escort dashboard</p>
                    <h1 class="mt-2 text-2xl font-semibold text-slate-900">Welcome back, {{ auth()->user()->name }}</h1>
                </div>
                <a href="{{ route('owner.escorts.create') }}" class="rounded-full bg-purple-600 px-4 py-2 text-sm font-semibold text-white">Create profile</a>
            </div>

            <div class="mt-8 grid gap-4 sm:grid-cols-3">
                <div class="rounded-xl bg-slate-50 p-4">
                    <p class="text-sm text-slate-500">Profiles</p>
                    <p class="mt-2 text-2xl font-semibold text-slate-900">{{ $escorts->count() }}</p>
                </div>
                <div class="rounded-xl bg-slate-50 p-4">
                    <p class="text-sm text-slate-500">Verification</p>
                    <p class="mt-2 text-2xl font-semibold text-slate-900">{{ $escorts->where('verification_status', 'verified')->count() }}</p>
                </div>
                <div class="rounded-xl bg-slate-50 p-4">
                    <p class="text-sm text-slate-500">Pending review</p>
                    <p class="mt-2 text-2xl font-semibold text-slate-900">{{ $escorts->where('verification_status', 'pending')->count() }}</p>
                </div>
            </div>

            <div class="mt-6 rounded-xl border border-purple-100 bg-purple-50 p-4 text-sm text-slate-700">
                <p class="font-semibold text-purple-700">Role status</p>
                <p class="mt-2">You are currently signed in as {{ auth()->user()->isPremiumEscort() ? 'a premium escort' : (auth()->user()->isBasicEscort() ? 'a basic escort' : 'a client') }}.</p>
                @if (auth()->user()->isBasicEscort())
                    <p class="mt-2 text-purple-700">Upgrade to premium to unlock priority visibility and enhanced profile controls.</p>
                @endif
            </div>
            </div>
        </div>

        <div class="rounded-2xl border border-slate-200 bg-slate-900 p-6 text-white shadow-sm">
            <p class="text-sm font-semibold uppercase tracking-[0.2em] text-purple-300">Quick actions</p>
            <ul class="mt-5 space-y-3 text-sm text-slate-300">
                <li>• Keep your profile updated with fresh photos and availability.</li>
                <li>• Complete verification to unlock full discovery visibility.</li>
                <li>• Use the admin review workflow to track approvals.</li>
            </ul>
        </div>
    </div>

    <div class="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div class="border-b border-slate-200 px-6 py-4">
            <h2 class="text-lg font-semibold text-slate-900">Your listings</h2>
        </div>
        <div class="divide-y divide-slate-200">
            @forelse($escorts as $escort)
                <div class="flex items-center justify-between px-6 py-4">
                    <div>
                        <p class="font-semibold text-slate-900">{{ $escort->title }}</p>
                        <p class="text-sm text-slate-500">Status: {{ ucfirst($escort->verification_status ?? 'pending') }}</p>
                    </div>
                    <a href="{{ route('owner.escorts.edit', $escort) }}" class="text-sm font-semibold text-purple-600">Manage</a>
                </div>
            @empty
                <div class="px-6 py-8 text-sm text-slate-500">You have no listings yet.</div>
            @endforelse
        </div>
    </div>
</div>
@endsection

<footer class="relative isolate min-h-64 overflow-hidden border-t border-neutral-200">
    <div class="absolute inset-0 scale-110 bg-cover bg-center bg-no-repeat blur-md" style="background-image: url('{{ asset('images/footer_bg.jpeg') }}')"></div>
    <div class="absolute inset-0 bg-white/60"></div>
    <div class="relative mx-auto flex min-h-64 max-w-7xl flex-col justify-end gap-3 px-6 pb-6 pt-16 text-sm text-neutral-900 md:flex-row md:items-end md:justify-between">
        <div class="font-medium">Honeybee</div>
        <div class="flex flex-wrap gap-4">
            <a href="{{ route('legal.privacy') }}">Privacy</a>
            <a href="{{ route('legal.terms') }}">Terms</a>
            @if ($telegram = \App\Models\Setting::get('complaints_telegram'))
                <a href="https://t.me/{{ ltrim($telegram, '@') }}">Complaints</a>
            @endif
            @if ($support = \App\Models\Setting::get('support_email'))
                <a href="mailto:{{ $support }}">{{ $support }}</a>
            @endif
        </div>
    </div>
</footer>

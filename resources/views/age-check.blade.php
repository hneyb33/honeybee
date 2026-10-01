<x-guest-layout :wide="true">
    <div class="age-gate">
        <div>
            <p class="age-gate-kicker">Age verification</p>
            <h1>You must be 18 or older to continue</h1>
            <p class="age-gate-copy">This site contains adult-oriented content. Please confirm that you are at least 18 years of age before entering.</p>
        </div>

        <div class="age-gate-panel">
            <h2>Rules & guidelines</h2>
            <ul class="age-gate-rules">
                <li><span class="age-gate-index">1</span> You must be 18 years of age or older to access this site.</li>
                <li><span class="age-gate-index">2</span> All interactions and communication must remain respectful.</li>
                <li><span class="age-gate-index">3</span> No minors, prohibited services, or unsafe requests are permitted.</li>
                <li><span class="age-gate-index">4</span> Use a valid form of ID where required and follow local laws.</li>
            </ul>
        </div>

        @if(session('age_denied'))
            <div class="age-gate-denied">
                You must be 18 years or older to continue. Please return when you meet the age requirement.
            </div>
        @endif

        <div class="age-gate-actions">
            <form method="POST" action="{{ route('age-check.submit') }}">
                @csrf
                <button type="submit" name="over_18" value="1" class="age-gate-yes">Yes, I am 18+ and accept the rules</button>
            </form>

            <a href="https://www.google.com" class="age-gate-no">No, leave site</a>
        </div>
    </div>
</x-guest-layout>

<div
    class="inline-flex items-center rounded-full border border-[#767f88]/50 bg-white p-1 text-xs font-semibold dark:bg-[#1a1414]"
    x-data="{ dark: document.documentElement.classList.contains('dark') }"
>
    <button
        type="button"
        class="rounded-full px-3 py-1"
        :class="dark ? 'text-[#767f88]' : 'bg-[#0f0a0a] text-white'"
        @click="dark = false; localStorage.setItem('theme', 'light'); document.documentElement.classList.remove('dark'); document.documentElement.style.colorScheme = 'light'"
    >Light</button>
    <button
        type="button"
        class="rounded-full px-3 py-1"
        :class="dark ? 'bg-[#ffffff] text-[#0f0a0a]' : 'text-[#767f88]'"
        @click="dark = true; localStorage.setItem('theme', 'dark'); document.documentElement.classList.add('dark'); document.documentElement.style.colorScheme = 'dark'"
    >Dark</button>
</div>

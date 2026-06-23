import focus from '@alpinejs/focus';
import collapse from '@alpinejs/collapse';
import { Livewire, Alpine } from '../../vendor/livewire/livewire/dist/livewire.esm';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

window.gsap = gsap;
window.ScrollTrigger = ScrollTrigger;

Alpine.plugin(focus);
Alpine.plugin(collapse);

Livewire.start();

import Link from "next/link";
import { ArrowRight, ShieldCheck, Users } from "lucide-react";

export default function AboutUsPage() {
  return (
    <main className="mx-auto min-h-[65vh] max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <article className="relative isolate overflow-hidden rounded-[2rem] border border-neutral-800 bg-[#101211] shadow-2xl">
        <div className="absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full bg-[#d3444d]/15 blur-3xl" />
        <header className="border-b border-neutral-800 px-6 py-10 sm:px-12 sm:py-14">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#f17d83]">About Honeybee</p>
          <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
            Connect. Refresh. Chill.
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-neutral-300">
            Honeybee is a discovery and advertising platform connecting adults with provider profiles and independent services across Uganda.
          </p>
        </header>
        <div className="grid gap-4 px-6 py-8 sm:grid-cols-2 sm:px-12 sm:py-10">
          <section className="rounded-2xl border border-neutral-800 bg-black/20 p-5">
            <Users className="h-6 w-6 text-[#e5b34c]" />
            <h2 className="mt-4 font-semibold text-white">A place to discover</h2>
            <p className="mt-2 text-sm leading-7 text-neutral-300">
              Browse profiles, photos, videos, agencies, and classified listings to find options that suit your needs.
            </p>
          </section>
          <section className="rounded-2xl border border-neutral-800 bg-black/20 p-5">
            <ShieldCheck className="h-6 w-6 text-[#e5b34c]" />
            <h2 className="mt-4 font-semibold text-white">Review and transparency</h2>
            <p className="mt-2 text-sm leading-7 text-neutral-300">
              Profiles marked verified have passed Honeybee&apos;s review process. Verification is not a guarantee of identity, conduct, or service quality.
            </p>
          </section>
        </div>
        <footer className="flex flex-wrap items-center gap-3 border-t border-neutral-800 px-6 py-5 sm:px-12">
          <Link href="/contact" className="inline-flex items-center gap-2 rounded-full bg-[#d3444d] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#ad3039]">
            Contact Honeybee <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/disclaimer" className="rounded-full border border-neutral-700 px-4 py-2 text-sm font-semibold text-neutral-300 transition hover:border-neutral-400">
            Read our disclaimer
          </Link>
        </footer>
      </article>
    </main>
  );
}

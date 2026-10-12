import Link from "next/link";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const contactNumber = "256769219277";
const contactMessage = encodeURIComponent("Hello Honeybee, I need help with the platform.");

export default function ContactPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-5 py-14 sm:px-8">
      <section className="w-full rounded-3xl border border-neutral-800 bg-neutral-900 p-7 sm:p-10">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#e5b34c]">We’re here to help</p>
        <h1 className="mt-2 font-display text-3xl font-semibold text-white sm:text-4xl">Contact Honeybee</h1>
        <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-400">
          Questions about your profile, a listing, payments, or using Honeybee? Message our team on WhatsApp and tell us how we can help.
        </p>
        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
          <a
            href={`https://wa.me/${contactNumber}?text=${contactMessage}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button className="w-full rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 sm:w-auto">
              <MessageCircle className="mr-2 h-4 w-4" /> Message us on WhatsApp
            </Button>
          </a>
          <Link href="/">
            <Button variant="outline" className="w-full rounded-xl sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to discover
            </Button>
          </Link>
        </div>
      </section>
    </main>
  );
}

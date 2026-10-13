import Link from "next/link";
import { ArrowUpRight, Mail, Send } from "lucide-react";

const contactOptions = [
  {
    title: "Email support",
    description: "For account, listing, or payment questions, send our support team an email.",
    href: "mailto:support@honeybee.ug",
    label: "support@honeybee.ug",
    icon: Mail,
  },
  {
    title: "Complaints and safety",
    description: "Contact the Honeybee team on Telegram to report a concern about a listing or interaction.",
    href: "https://t.me/honeybee",
    label: "Message Honeybee",
    icon: Send,
  },
];

export default function ContactPage() {
  return (
    <main className="mx-auto min-h-[65vh] max-w-5xl px-5 py-10 sm:px-8 sm:py-14">
      <header className="relative overflow-hidden rounded-[2rem] border border-neutral-800 bg-[#101211] px-6 py-10 sm:px-12 sm:py-14">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#d3444d]/15 blur-3xl" />
        <p className="relative text-xs font-bold uppercase tracking-[0.2em] text-[#f17d83]">Honeybee support</p>
        <h1 className="relative mt-3 font-display text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          We&apos;re here to help.
        </h1>
        <p className="relative mt-3 max-w-2xl text-sm leading-6 text-neutral-300">
          Choose the contact option that best fits your question. Please do not send passwords or sensitive identity documents by email or chat.
        </p>
      </header>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {contactOptions.map(({ title, description, href, label, icon: Icon }) => (
          <section key={title} className="rounded-3xl border border-neutral-800 bg-card p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#d3444d]/10 text-[#f17d83]">
              <Icon className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-lg font-bold">{title}</h2>
            <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{description}</p>
            <Link
              href={href}
              target={href.startsWith("https://") ? "_blank" : undefined}
              rel={href.startsWith("https://") ? "noopener noreferrer" : undefined}
              className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-[#e45b63] hover:underline"
            >
              {label} <ArrowUpRight className="h-4 w-4" />
            </Link>
          </section>
        ))}
      </div>
    </main>
  );
}
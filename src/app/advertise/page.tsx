import Link from "next/link";
import { ArrowRight, Building2, ClipboardCheck, Zap } from "lucide-react";

const advertiserPaths = [
  {
    type: "fast",
    title: "Fast listing",
    description: "A guided, single-profile setup for getting one ad ready for review.",
    label: "One listing",
    icon: Zap,
  },
  {
    type: "independent",
    title: "Independent",
    description: "Create and manage your own public profile and contact details.",
    label: "Individual",
    icon: ClipboardCheck,
  },
  {
    type: "agency",
    title: "Agency",
    description: "Register as an agency and submit profiles for moderation.",
    label: "Business",
    icon: Building2,
  },
];

export default function AdvertisePage() {
  return (
    <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#d3444d]">For advertisers</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Put your profile in the right hands.
        </h1>
        <p className="mt-4 text-sm leading-6 text-muted-foreground sm:text-base">
          Choose how you want to advertise. Every profile is reviewed before it appears, and featured placement is activated only after payment verification.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {advertiserPaths.map(({ type, title, description, label, icon: Icon }) => (
          <article key={type} className="flex flex-col rounded-3xl border border-border bg-card p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f9e9e9] text-[#c63843] dark:bg-rose-950/40">
              <Icon className="h-5 w-5" />
            </div>
            <span className="mt-5 w-fit rounded-full bg-muted px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
            <h2 className="mt-3 text-xl font-bold text-foreground">{title}</h2>
            <p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{description}</p>
            <Link
              href={`/register?advertiser_type=${type}`}
              className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#d3444d] px-5 text-sm font-bold text-white transition hover:bg-[#ad3039]"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Link>
          </article>
        ))}
      </div>
      <p className="mt-7 text-center text-xs text-muted-foreground">
        Already have an account? <Link href="/login?next=%2Fprovider%2Fonboarding" className="font-semibold text-[#d3444d] hover:underline">Sign in to continue</Link>
      </p>
      <p className="mt-5 text-center text-sm text-muted-foreground">
        Offering a home or wellness service?{" "}
        <Link href="/register?account_kind=specialist" className="font-semibold text-[#d3444d] hover:underline">
          Register as a specialist
        </Link>
      </p>
    </main>
  );
}

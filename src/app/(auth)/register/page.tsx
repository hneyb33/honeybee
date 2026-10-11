"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Crown, ChefHat, Building2, Zap, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"client" | "specialist" | "model" | "agency">("client");
  const [advertiserType, setAdvertiserType] = useState<"fast" | "independent" | "agency" | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedKind = params.get("account_kind");
    if (requestedKind === "specialist") {
      setRole("specialist");
      return;
    }
    const requestedType = params.get("advertiser_type");
    if (requestedType === "fast" || requestedType === "independent" || requestedType === "agency") {
      setAdvertiserType(requestedType);
      setRole(requestedType === "agency" ? "agency" : "model");
    }
  }, []);

  const onboardingPath = `/provider/onboarding${advertiserType ? `?type=${advertiserType}` : ""}`;

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!supabase) {
      setError("Registration is unavailable until Supabase is configured.");
      return;
    }

    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone,
          account_kind: role,
          advertiser_type: advertiserType ?? (role === "agency" ? "agency" : role === "model" ? "independent" : null),
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }

    if (!data.session) {
      setMessage("Check your email to confirm your account. After confirming, sign in to continue setting up your ad.");
      return;
    }

    router.replace(role === "specialist" || role === "model" || role === "agency" ? onboardingPath : "/dashboard");
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg items-center px-4 py-12">
      <Card className="w-full rounded-3xl border-border shadow-xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Register for Honeybee
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Choose the account type that matches what you want to do.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="rounded-2xl border border-border bg-muted/50 p-3">
            <p className="mb-2 text-xs font-semibold text-muted-foreground">Advertising as</p>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "fast", label: "Fast ad", icon: Zap },
                { id: "independent", label: "Independent", icon: UserRound },
                { id: "agency", label: "Agency", icon: Building2 },
              ] as const).map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  type="button"
                  aria-pressed={advertiserType === id}
                  onClick={() => {
                    setAdvertiserType(id);
                    setRole(id === "agency" ? "agency" : "model");
                  }}
                  className={`flex min-h-16 flex-col items-center justify-center gap-1 rounded-xl border px-2 py-2 text-center text-[11px] font-semibold transition ${
                    advertiserType === id
                      ? "border-[#d3444d] bg-rose-50 text-[#a8323c] dark:bg-rose-950/30 dark:text-rose-200"
                      : "border-border bg-background text-muted-foreground hover:border-foreground/30"
                  }`}
                >
                  <Icon className="h-4 w-4" /> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Role Choice Cards */}
          <div className="space-y-2.5">
            <button
              type="button"
              onClick={() => setRole("client")}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                role === "client"
                  ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <Users className="h-5 w-5 text-airbnb-coral mt-0.5 shrink-0" />
              <div>
                <span className="block font-bold text-sm text-foreground">Client</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Browse verified listings, schedule appointments, and write reviews.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("specialist")}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                role === "specialist"
                  ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <ChefHat className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <span className="block font-bold text-sm text-foreground">Specialist</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Provide home services (private chef, laundry, massage, or repairs).
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setRole("model")}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                role === "model"
                  ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <Crown className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
              <div>
                <span className="block font-bold text-sm text-foreground">VIP Companion</span>
                <span className="block text-xs text-muted-foreground mt-0.5">
                  Provide verified companion and entertainment hosting services.
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                setRole("agency");
                setAdvertiserType("agency");
              }}
              className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                role === "agency"
                  ? "border-neutral-900 bg-neutral-50 dark:border-white dark:bg-neutral-900"
                  : "border-border hover:border-foreground/40"
              }`}
            >
              <Building2 className="mt-0.5 h-5 w-5 shrink-0 text-[#d3444d]" />
              <div>
                <span className="block text-sm font-bold text-foreground">Agency advertiser</span>
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  Submit agency-managed profiles for verification and ad placement.
                </span>
              </div>
            </button>
          </div>

          {/* Registration Fields */}
          <form onSubmit={handleRegister} className="space-y-4 pt-2">
            <div>
              <label htmlFor="name" className="text-xs font-semibold text-foreground">Full Name</label>
              <Input
                id="name"
                required
                autoComplete="name"
                placeholder="e.g. Samuel Kato"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <label htmlFor="email" className="text-xs font-semibold text-foreground">Email</label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <label htmlFor="phone" className="text-xs font-semibold text-foreground">Phone Number</label>
              <Input
                id="phone"
                required
                autoComplete="tel"
                placeholder="+256 700 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-semibold text-foreground">Password</label>
              <Input
                id="password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5"
              />
            </div>

            {!isSupabaseConfigured && (
              <p role="status" className="text-sm text-amber-700">
                Configure the Supabase URL and anon key to enable registration.
              </p>
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            {message && (
              <div role="status" className="space-y-2 text-sm text-emerald-700">
                <p>{message}</p>
                <Link
                  href={`/login?next=${encodeURIComponent(onboardingPath)}`}
                  className="inline-block font-semibold text-[#d3444d] underline underline-offset-2"
                >
                  Continue to sign in
                </Link>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="mt-2 h-11 w-full rounded-xl bg-airbnb-coral font-bold text-white shadow-md hover:bg-[#AD3039]"
            >
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <div className="text-center text-xs text-muted-foreground pt-2">
            Already have an account?{" "}
            <Link href="/login" className="font-bold text-foreground hover:underline">
              Log in
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

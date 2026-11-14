"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Users, Crown, ChefHat, Building2, Zap, UserRound, Eye, EyeOff, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { EAST_AFRICAN_COUNTRIES } from "@/lib/data/uganda-locations";
import { Turnstile, requestTurnstilePass } from "@/components/ui/Turnstile";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = useState<"client" | "specialist" | "model" | "agency">("client");
  const [advertiserType, setAdvertiserType] = useState<"fast" | "independent" | "agency" | null>(null);
  // Two-screen registration: (1) choose who to register as, (2) credentials.
  const [screen, setScreen] = useState<"choose" | "details">("choose");
  const [modelTier, setModelTier] = useState<"premium" | "vip">("premium");
  const [identityChosen, setIdentityChosen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [phone, setPhone] = useState("");
  const [country, setCountry] = useState("Uganda");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  // Turnstile tokens are single-use; failures remount the widget.
  const [turnstileRetry, setTurnstileRetry] = useState(0);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const requestedKind = params.get("account_kind");
    if (requestedKind === "specialist") {
      setRole("specialist");
      setIdentityChosen(true);
      return;
    }
    const requestedType = params.get("advertiser_type");
    if (requestedType === "fast" || requestedType === "independent" || requestedType === "agency") {
      setAdvertiserType(requestedType);
      setRole(requestedType === "agency" ? "agency" : "model");
      setIdentityChosen(true);
    }
  }, []);

  const onboardingPath = `/provider/onboarding${advertiserType ? `?type=${advertiserType}` : ""}`;
  const selectedCountry = EAST_AFRICAN_COUNTRIES.find((item) => item.name === country) ?? EAST_AFRICAN_COUNTRIES[0];

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (!supabase) {
      setError("Registration is unavailable until Supabase is configured.");
      return;
    }

    setLoading(true);
    // Human check first: the server rejects anything but a fresh solved token.
    const humanPass = await requestTurnstilePass(turnstileToken, "register");
    if (!humanPass) {
      setLoading(false);
      setError("Please complete the human check and try again.");
      setTurnstileToken(null);
      setTurnstileRetry((value) => value + 1);
      return;
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone: `${selectedCountry.callingCode} ${phone}`,
          phone_country: selectedCountry.callingCode,
          country: selectedCountry.name,
          account_kind: role,
          advertiser_type: advertiserType ?? (role === "agency" ? "agency" : role === "model" ? "independent" : null),
          model_tier: role === "model" || role === "agency" ? modelTier : undefined,
        },
      },
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      // A rejected attempt burned the token - require a fresh solve.
      setTurnstileToken(null);
      setTurnstileRetry((value) => value + 1);
      return;
    }

    if (!data.session) {
      setMessage("Check your email to confirm your account. After confirming, sign in to continue setting up your ad.");
      return;
    }

    router.replace(role === "specialist" || role === "model" || role === "agency" ? onboardingPath : "/dashboard");
    router.refresh();
  };

  const IDENTITY_CARDS = [
    {
      id: "client",
      title: "Client",
      blurb: "Browse verified listings, schedule appointments, and write reviews.",
      icon: Users,
      tone: "text-airbnb-coral",
    },
    {
      id: "model_premium",
      title: "Companion — Premium",
      blurb: "List as a companion model. Your profile shows normally once verified.",
      icon: Crown,
      tone: "text-amber-500",
    },
    {
      id: "model_vip",
      title: "Companion — VIP",
      blurb: "Elite visibility: your profile stays blurred to visitors until they hold a subscriber plan.",
      icon: Sparkles,
      tone: "text-[#d3444d]",
    },
    {
      id: "specialist",
      title: "Service provider",
      blurb: "Provide home services (private chef, laundry, massage, or repairs).",
      icon: ChefHat,
      tone: "text-emerald-600",
    },
    {
      id: "agency",
      title: "Agency advertiser",
      blurb: "Submit agency-managed profiles for verification and ad placement.",
      icon: Building2,
      tone: "text-[#d3444d]",
    },
  ] as const;

  const applyChoice = (id: (typeof IDENTITY_CARDS)[number]["id"]) => {
    setIdentityChosen(true);
    if (id === "client") {
      setRole("client");
      setAdvertiserType(null);
    } else if (id === "model_premium") {
      setRole("model");
      setModelTier("premium");
    } else if (id === "model_vip") {
      setRole("model");
      setModelTier("vip");
    } else if (id === "specialist") {
      setRole("specialist");
      setAdvertiserType(null);
    } else {
      setRole("agency");
      setAdvertiserType("agency");
    }
  };

  const isChoiceActive = (id: (typeof IDENTITY_CARDS)[number]["id"]) => {
    if (!identityChosen) return false;
    if (id === "client") return role === "client";
    if (id === "model_premium") return role === "model" && modelTier === "premium";
    if (id === "model_vip") return role === "model" && modelTier === "vip";
    if (id === "specialist") return role === "specialist";
    return role === "agency";
  };

  const identityLabel =
    role === "agency"
      ? "Agency"
      : role === "specialist"
        ? "Service provider"
        : role === "model"
          ? modelTier === "vip"
            ? "VIP companion"
            : "Companion"
          : "Client";

  return (
    <div className="mx-auto flex min-h-[80vh] w-full max-w-xl items-center px-4 py-12">
      <Card className="w-full rounded-3xl border-border shadow-xl">
        <CardHeader className="text-center pb-4">
          <CardTitle className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {screen === "choose" ? "Register for Honeybee" : `Create your ${identityLabel} account`}
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            {screen === "choose"
              ? "Step 1 of 2 — choose how you want to use Honeybee."
              : "Step 2 of 2 — your profile stays private until an admin verifies it."}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {screen === "choose" ? (
            <>
              <div className="space-y-2.5">
                {IDENTITY_CARDS.map((card) => {
                  const Icon = card.icon;
                  const active = isChoiceActive(card.id);
                  return (
                    <button
                      key={card.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => applyChoice(card.id)}
                      className={`flex w-full items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                        active
                          ? "border-airbnb-coral bg-rose-50 dark:bg-rose-950/30"
                          : "border-border hover:border-foreground/40"
                      }`}
                    >
                      <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${card.tone}`} />
                      <div>
                        <span className="block text-sm font-bold text-foreground">{card.title}</span>
                        <span className="mt-0.5 block text-xs text-muted-foreground">{card.blurb}</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {identityChosen && role === "model" && (
                <div className="rounded-2xl border border-border bg-muted/50 p-3">
                  <p className="mb-2 text-xs font-semibold text-muted-foreground">Advertising style</p>
                  <div className="grid grid-cols-2 gap-2">
                    {([
                      { id: "fast", label: "Fast ad", icon: Zap },
                      { id: "independent", label: "Independent", icon: UserRound },
                    ] as const).map(({ id, label, icon: AdIcon }) => (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={advertiserType === id}
                        onClick={() => setAdvertiserType(id)}
                        className={`flex min-h-12 items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-[11px] font-semibold transition ${
                          advertiserType === id
                            ? "border-[#d3444d] bg-rose-50 text-[#a8323c] dark:bg-rose-950/30 dark:text-rose-200"
                            : "border-border bg-background text-muted-foreground hover:border-foreground/30"
                        }`}
                      >
                        <AdIcon className="h-4 w-4" /> {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <Button
                type="button"
                disabled={!identityChosen}
                onClick={() => setScreen("details")}
                className="h-11 w-full rounded-xl bg-airbnb-coral font-bold text-white shadow-md hover:bg-[#AD3039]"
              >
                Continue
              </Button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setScreen("choose")}
                className="text-xs font-semibold text-airbnb-coral hover:underline"
              >
                ← Change account type
              </button>

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
              <label htmlFor="country" className="text-xs font-semibold text-foreground">Country</label>
              <select
                id="country"
                required
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="mt-1.5 h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {EAST_AFRICAN_COUNTRIES.map((item) => (
                  <option key={item.name} value={item.name}>{item.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="phone" className="text-xs font-semibold text-foreground">Phone Number</label>
              <div className="mt-1.5 flex gap-2">
                <span className="inline-flex items-center rounded-md border border-input bg-muted px-3 text-sm font-semibold" aria-label={`Country calling code ${selectedCountry.callingCode}`}>
                  {selectedCountry.callingCode}
                </span>
                <Input
                  id="phone"
                  type="tel"
                  required
                  autoComplete="tel-national"
                  inputMode="tel"
                  placeholder="700 000 000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-semibold text-foreground">Password</label>
              <div className="relative mt-1.5">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirm-password" className="text-xs font-semibold text-foreground">Confirm password</label>
              <div className="relative mt-1.5">
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((visible) => !visible)}
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  aria-pressed={showConfirmPassword}
                  className="absolute inset-y-0 right-0 inline-flex w-11 items-center justify-center text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {!isSupabaseConfigured && (
              <p role="status" className="text-sm text-amber-700">
                Configure the Supabase URL and anon key to enable registration.
              </p>
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <Turnstile
              key={turnstileRetry}
              action="register"
              onToken={setTurnstileToken}
              className="pt-1"
            />
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
            </>
          )}

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

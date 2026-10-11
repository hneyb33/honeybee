"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [nextPath, setNextPath] = useState("");

  useEffect(() => {
    const requestedPath = new URLSearchParams(window.location.search).get("next") ?? "";
    if (requestedPath.startsWith("/") && !requestedPath.startsWith("//")) {
      setNextPath(requestedPath);
    }
  }, []);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!supabase) {
      setError("Sign-in is unavailable until Supabase is configured.");
      return;
    }

    setLoading(true);
    const { data, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setLoading(false);
      setError(signInError.message);
      return;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profileError || !profile) {
      await supabase.auth.signOut();
      setLoading(false);
      setError(profileError?.message ?? "This account does not have a Honeybee profile.");
      return;
    }

    setLoading(false);
    if (profile.role === "super_admin" || profile.role === "moderator") {
      router.replace("/admin");
    } else {
      router.replace(nextPath || "/dashboard");
    }
    router.refresh();
  };

  return (
    <div className="mx-auto flex min-h-[75vh] max-w-md items-center px-4 py-12">
      <Card className="w-full rounded-3xl border-border shadow-xl">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto mb-2 flex h-11 w-11 items-center justify-center rounded-full bg-muted">
            <Lock className="h-5 w-5 text-airbnb-coral" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Log in to Honeybee</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Sign in to access your account. Admin access is granted to authorised accounts only.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="email" className="text-xs font-semibold text-foreground">
                Email Address
              </label>
              <Input
                id="email"
                type="email"
                autoComplete="username"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-1.5"
              />
            </div>

            <div>
              <label htmlFor="password" className="text-xs font-semibold text-foreground">
                Password
              </label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-1.5"
              />
            </div>

            {!isSupabaseConfigured && (
              <p role="status" className="text-sm text-amber-700">
                Configure the Supabase URL and anon key to enable sign-in.
              </p>
            )}
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loading || !isSupabaseConfigured}
              className="mt-2 h-11 w-full rounded-xl bg-airbnb-coral font-bold text-white shadow-md hover:bg-[#AD3039]"
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="border-t border-border pt-4 text-center text-xs text-muted-foreground">
              Don&apos;t have an account yet?{" "}
              <Link href="/register" className="font-bold text-foreground hover:underline">
                Register
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

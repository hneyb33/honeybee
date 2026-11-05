"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import { isAdminRole, type AdminRole } from "@/lib/admin/permissions";

export interface AdminProfileSummary {
  id: string;
  name: string;
  email: string | null;
  role: AdminRole;
  avatar_url: string | null;
}

export interface AdminSessionValue {
  ready: boolean;
  configured: boolean;
  profile: AdminProfileSummary | null;
  role: AdminRole | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AdminSessionContext = createContext<AdminSessionValue | null>(null);

/**
 * Loads the caller's admin identity once at the top of `/admin/*` and exposes
 * it to every page/component via context. Pages should read the role from
 * `useAdminSession()` rather than re-fetching `profiles` themselves.
 */
export function AdminSessionProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [profile, setProfile] = useState<AdminProfileSummary | null>(null);

  const load = useCallback(async () => {
    if (!isSupabaseConfigured || !supabase) {
      setReady(true);
      setProfile(null);
      return;
    }
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      setProfile(null);
      setReady(true);
      router.replace("/login?next=%2Fadmin");
      return;
    }
    const { data: row, error: profileError } = await supabase
      .from("profiles")
      .select("id,name,email,role,avatar_url")
      .eq("id", authData.user.id)
      .maybeSingle();

    if (profileError || !row || !isAdminRole(row.role)) {
      setProfile(null);
      setReady(true);
      router.replace("/");
      return;
    }
    setProfile({
      id: row.id,
      name: row.name ?? "Admin",
      email: row.email ?? null,
      role: row.role,
      avatar_url: row.avatar_url ?? null,
    });
    setReady(true);
  }, [router]);

  useEffect(() => {
    void load();
  }, [load]);

  const signOut = useCallback(async () => {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (!error) router.replace("/login");
  }, [router]);

  const value = useMemo<AdminSessionValue>(
    () => ({
      ready,
      configured: isSupabaseConfigured,
      profile,
      role: profile?.role ?? null,
      signOut,
      refresh: load,
    }),
    [ready, profile, signOut, load],
  );

  return <AdminSessionContext.Provider value={value}>{children}</AdminSessionContext.Provider>;
}

export function useAdminSession(): AdminSessionValue {
  const ctx = useContext(AdminSessionContext);
  if (!ctx) throw new Error("useAdminSession must be used inside <AdminSessionProvider>");
  return ctx;
}

"use client";

import { useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

/**
 * Client-side VIP gating.
 *
 * A listing with `escort_tier === 'vip'` renders blurred for visitors who do
 * not hold an active `client_premium` subscription (checked server-side by the
 * `can_view_vip()` SECURITY DEFINER RPC). Owners always see their own profile
 * sharp, which is a per-row `user_id` comparison done here on the client.
 *
 * Known limitation: the blur is a client-side affordance, not a security
 * boundary — the variant URLs stay technically reachable. Server-side signed
 * media delivery is out of scope for this pass.
 */

/** Columns every public listing fetch must select for gating to work. */
export const VIP_LISTING_FIELDS = "id,escort_tier,user_id";

export interface VipGate {
  /** True when this listing's media must stay blurred for the viewer. */
  gated: boolean;
  /** The viewer's VIP entitlement is still resolving. */
  loading: boolean;
  /** Where gated cards should link instead of the profile page. */
  subscribeUrl: string;
}

type VipAccess = { loading: boolean; canView: boolean; viewerId: string | null };

const IDLE: VipAccess = { loading: false, canView: false, viewerId: null };

// One session + `can_view_vip` round-trip per visitor, shared by every card on
// the page (and every page in the session). Sign-in/out or a completed
// subscription invalidate it through refreshVipAccess().
let accessPromise: Promise<VipAccess> | null = null;
let accessRequested = false;
let cachedAccess: VipAccess = IDLE;

function loadAccess(): Promise<VipAccess> {
  const client = supabase;
  if (!client) return Promise.resolve(IDLE);
  const promise = client.auth
    .getSession()
    .then(async ({ data }) => {
      const session = data.session;
      if (!session) return { loading: false, canView: false, viewerId: null };
      const { data: allowed, error } = await client.rpc("can_view_vip");
      if (error) {
        console.error("Could not check VIP entitlement:", error.message);
      }
      return {
        loading: false,
        canView: Boolean(allowed) && !error,
        viewerId: session.user.id,
      };
    })
    .catch((cause: unknown) => {
      console.error("VIP access check failed:", cause);
      return IDLE;
    });
  accessPromise = promise;
  return promise;
}

function getAccess(): Promise<VipAccess> {
  if (!supabase) return Promise.resolve(IDLE);
  if (accessPromise) return accessPromise;
  if (cachedAccess !== IDLE) return Promise.resolve(cachedAccess);
  return loadAccess();
}

/** Re-resolves entitlements after sign-in/out or a completed subscription. */
export function refreshVipAccess(): void {
  accessPromise = null;
  cachedAccess = IDLE;
  accessRequested = false;
}

/**
 * Pure gate decision for one listing. `canView`/`viewerId` may still be
 * resolving (`null`), in which case nothing is gated yet — cards render sharp
 * for a frame instead of flickering blurred→sharp for entitled viewers.
 */
export function isVipGated(
  listing: { escort_tier?: string | null; user_id?: string | null },
  canView: boolean | null,
  viewerId: string | null | undefined
): boolean {
  if (listing.escort_tier !== "vip") return false;
  if (canView === null) return false;
  if (canView) return false;
  if (viewerId && listing.user_id && viewerId === listing.user_id) return false;
  return true;
}

/** Hook variant used by directories and cards that render listing media. */
export function useVipAccess(
  listing: { escort_tier?: string | null; user_id?: string | null } | null | undefined
): VipGate {
  const [access, setAccess] = useState<VipAccess>(
    // Warm path: entitlements already resolved, render the final state
    // immediately so navigating back from /subscribe does not flash sharp cards.
    cachedAccess
  );

  useEffect(() => {
    if (!supabase || listing?.escort_tier !== "vip") return;
    let cancelled = false;
    if (!accessRequested) {
      accessRequested = true;
      void getAccess().then((result) => {
        cachedAccess = result;
      });
    }
    if (cachedAccess !== IDLE) {
      setAccess(cachedAccess);
      return;
    }
    setAccess((current) => (current.loading ? current : { ...IDLE, loading: true }));
    void getAccess().then((result) => {
      if (cancelled) return;
      cachedAccess = result;
      setAccess(result);
    });
    return () => {
      cancelled = true;
    };
  }, [listing?.escort_tier]);

  const loading = listing?.escort_tier === "vip" && access === IDLE && Boolean(accessPromise);
  const gated =
    Boolean(listing) && !loading && isVipGated(listing!, access.canView, access.viewerId);
  return { gated, loading, subscribeUrl: "/subscribe?reason=vip" };
}

/** Frosted overlay shown in place of gated media. Purely presentational. */
export function VipBlurOverlay({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 z-[2] flex items-center justify-center bg-gradient-to-t from-black/55 via-black/10 to-black/20 ${className}`}
    >
      <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-[#75501a] shadow-lg">
        <Lock className="h-3.5 w-3.5" /> VIP
      </span>
    </span>
  );
}

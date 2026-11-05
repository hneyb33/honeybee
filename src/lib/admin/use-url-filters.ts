"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Reads filter state from the URL search params and writes updates via
 * `router.replace`. Keeping filters in the URL means back/forward and shared
 * links preserve list state (page number, status, search term).
 */
export function useUrlFilters(defaults: Record<string, string> = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const values = useMemo<Record<string, string>>(() => {
    const merged: Record<string, string> = { ...defaults };
    searchParams.forEach((value, key) => {
      merged[key] = value;
    });
    return merged;
  }, [searchParams, defaults]);

  const commit = useCallback(
    (patch: Record<string, string>) => {
      const next = new URLSearchParams(searchParams?.toString() ?? "");
      for (const [key, value] of Object.entries(patch)) {
        if (!value) next.delete(key);
        else next.set(key, value);
      }
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const reset = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  return { values, commit, reset };
}

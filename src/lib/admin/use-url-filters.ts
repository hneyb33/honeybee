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

  // Callers pass inline literals (`useUrlFilters({ page: "1" })`), so `defaults`
  // is a new object on every render. Depend on its serialized form instead; a
  // `defaults` identity dependency made `values`→`filters`→`load` change every
  // render, re-firing the list-fetch effect in an endless loop until the browser
  // aborted requests with ERR_INSUFFICIENT_RESOURCES.
  const defaultsKey = JSON.stringify(defaults);

  const values = useMemo<Record<string, string>>(() => {
    const merged = JSON.parse(defaultsKey) as Record<string, string>;
    searchParams.forEach((value, key) => {
      merged[key] = value;
    });
    return merged;
  }, [searchParams, defaultsKey]);

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

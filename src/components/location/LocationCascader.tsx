"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  fetchGazetteerCountries,
  fetchLocationAncestorCodes,
  fetchLocationChildren,
  labelForChildType,
  type GazetteerNode,
} from "@/lib/locations";

export interface LocationPick {
  /** Full selected chain, country first (e.g. UG → Central → Kampala → Kololo). */
  trail: GazetteerNode[];
  country: GazetteerNode | null;
  city: GazetteerNode | null;
  neighborhood: GazetteerNode | null;
  /** True when the deepest selected node has no children: nothing deeper to pick. */
  isLeaf: boolean;
}

interface LocationCascaderProps {
  /** Deepest known code to pre-fill the chain (neighbourhood, city or country). */
  initialCode?: string | null;
  /** Country code seed when only the country name is known yet. */
  initialCountryCode?: string | null;
  onChange: (pick: LocationPick) => void;
  /** Rendered while loading or when the gazetteer has no data for this country. */
  fallback?: React.ReactNode;
  className?: string;
}

function toPick(trail: GazetteerNode[], isLeaf = false): LocationPick {
  return {
    trail,
    country: trail[0] ?? null,
    city: trail.find((node) => node.location_type === "CITY" || node.location_type === "TOWN") ?? null,
    neighborhood: trail.find((node) => node.location_type === "NEIGHBOURHOOD") ?? null,
    isLeaf,
  };
}

/**
 * Cascading location selector over the shared gazetteer: Country → County /
 * Region → District → City / Town → Neighbourhood. Levels are data-driven —
 * Kenya shows County → Town, Uganda shows Region → District → City → Division —
 * so expanding into new markets never needs frontend list changes. When the
 * gazetteer is still loading or has no rows for a country, the caller's
 * `fallback` (the legacy static selects) keeps the step usable.
 */
export function LocationCascader({
  initialCode,
  initialCountryCode,
  onChange,
  fallback,
  className,
}: LocationCascaderProps) {
  const [countries, setCountries] = useState<GazetteerNode[]>([]);
  const [trail, setTrail] = useState<GazetteerNode[]>([]);
  const [childrenByCode, setChildrenByCode] = useState<Record<string, GazetteerNode[]>>({});
  const [loading, setLoading] = useState(true);
  const [bootstrapping, setBootstrapping] = useState(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;
    void fetchGazetteerCountries().then((rows) => {
      if (cancelled) return;
      setCountries(rows);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Pre-fill the chain from the deepest known code (walks ancestors upward).
  useEffect(() => {
    let cancelled = false;
    if (loading) return;
    const seed = async () => {
      setBootstrapping(true);
      let next: GazetteerNode[] = [];
      if (initialCode) {
        next = await fetchLocationAncestorCodes(initialCode);
      }
      if (next.length === 0 && initialCountryCode) {
        const match = countries.find((country) => country.code === initialCountryCode);
        if (match) {
          next = [match];
          const kids = await fetchLocationChildren(match.code);
          setChildrenByCode((current) => ({ ...current, [match.code]: kids }));
        }
      }
      if (cancelled) return;
      setTrail(next);
      // Load children for every level of the restored chain.
      let deepestKids: GazetteerNode[] = [];
      for (const node of next) {
        const kids = await fetchLocationChildren(node.code);
        if (cancelled) return;
        setChildrenByCode((current) => ({ ...current, [node.code]: kids }));
        deepestKids = kids;
      }
      onChangeRef.current(toPick(next, next.length > 0 && deepestKids.length === 0));
      setBootstrapping(false);
    };
    void seed();
    return () => {
      cancelled = true;
    };
    // Re-run only when the seeded location actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, initialCode, initialCountryCode]);

  const loadLevel = useCallback(async (parentCode: string) => {
    const kids = await fetchLocationChildren(parentCode);
    setChildrenByCode((current) => ({ ...current, [parentCode]: kids }));
    return kids;
  }, []);

  const selectAt = useCallback(
    async (level: number, node: GazetteerNode | null) => {
      const base = trail.slice(0, level);
      if (!node) {
        setTrail(base);
        onChangeRef.current(toPick(base));
        return;
      }
      const next = [...base, node];
      setTrail(next);
      // Resolve the pick only after the child tier is known, so callers can
      // tell "Kampala → choose a division" apart from a leaf town like
      // Entebbe that has nothing below it.
      const kids = childrenByCode[node.code] ?? (await loadLevel(node.code));
      onChangeRef.current(toPick(next, kids.length === 0));
    },
    [trail, childrenByCode, loadLevel],
  );

  const countrySelected = trail[0] ?? null;

  // Levels after the country: one select per selected node that has children.
  const levels = useMemo(() => {
    if (!countrySelected) return [];
    const result: Array<{ parent: GazetteerNode; options: GazetteerNode[] | undefined; selected: GazetteerNode | null }> = [];
    for (let i = 0; i < trail.length; i += 1) {
      const parent = trail[i];
      const options = childrenByCode[parent.code];
      const selected = trail[i + 1] ?? null;
      if (options && options.length === 0) break;
      result.push({ parent, options, selected });
      if (!selected) break;
    }
    return result;
  }, [trail, childrenByCode]);

  if (loading || bootstrapping) return <>{fallback ?? null}</>;
  // Tanzania (and any future country not yet gazetteered) keeps the legacy
  // static selects instead of an empty cascade.
  if (countries.length === 0) {
    return <>{fallback ?? null}</>;
  }

  const summary = trail.map((node) => node.name).join(" / ");

  return (
    <div className={className ?? "grid gap-4 sm:grid-cols-2"}>
      <div>
        <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Country</label>
        <select
          value={countrySelected?.code ?? ""}
          onChange={(event) => {
            const node = countries.find((country) => country.code === event.target.value) ?? null;
            void selectAt(0, node);
          }}
          className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground"
          aria-label="Select country"
        >
          <option value="">Choose country</option>
          {countries.map((country) => (
            <option key={country.code} value={country.code}>
              {country.name}
            </option>
          ))}
        </select>
      </div>

      {levels.map((level, index) => {
        const placeholder = level.options
          ? `Choose ${labelForChildType(level.options[0]?.location_type).toLowerCase()}`
          : "Loading…";
        return (
          <div key={level.parent.code}>
            <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">
              {labelForChildType(level.options?.[0]?.location_type)}
            </label>
            <select
              value={level.selected?.code ?? ""}
              onChange={(event) => {
                const node = (level.options ?? []).find((child) => child.code === event.target.value) ?? null;
                void selectAt(index + 1, node);
              }}
              disabled={!level.options}
              className="h-11 w-full rounded-xl border border-border bg-card px-3 text-sm font-semibold text-foreground disabled:opacity-60"
              aria-label={labelForChildType(level.options?.[0]?.location_type)}
            >
              <option value="">{placeholder}</option>
              {(level.options ?? []).map((child) => (
                <option key={child.code} value={child.code}>
                  {child.name}
                </option>
              ))}
            </select>
          </div>
        );
      })}

      {summary ? (
        <p className="text-xs font-medium text-muted-foreground sm:col-span-2">
          Selected location: <span className="font-bold text-foreground">{summary}</span>
        </p>
      ) : null}
    </div>
  );
}

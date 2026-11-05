"use client";

import { useEffect, useState } from "react";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface FilterChipOption {
  value: string;
  label: string;
}

export interface FilterField {
  key: string;
  label: string;
  type: "select" | "date" | "text";
  options?: FilterChipOption[];
  placeholder?: string;
}

/**
 * Free-text search plus a small set of dropdown / date filters. Values are
 * controlled from the URL search params so deep links stay meaningful.
 */
export function AdminFilterBar({
  values,
  fields,
  searchPlaceholder = "Search…",
  onCommit,
  onReset,
  rightSlot,
}: {
  values: Record<string, string>;
  fields: FilterField[];
  searchPlaceholder?: string;
  onCommit: (patch: Record<string, string>) => void;
  onReset: () => void;
  rightSlot?: React.ReactNode;
}) {
  const [q, setQ] = useState(values.q ?? "");
  useEffect(() => setQ(values.q ?? ""), [values.q]);

  const hasActive = Boolean(values.q) || fields.some((f) => values[f.key]);

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
      <form
        className="relative min-w-[220px] flex-1"
        onSubmit={(event) => {
          event.preventDefault();
          onCommit({ q: q.trim(), page: "1" });
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(event) => setQ(event.target.value)}
          placeholder={searchPlaceholder}
          className="h-9 rounded-xl pl-9 pr-3 text-sm"
        />
      </form>

      {fields.map((field) => (
        <FilterControl
          key={field.key}
          field={field}
          value={values[field.key] ?? ""}
          onChange={(next) => onCommit({ [field.key]: next, page: "1" })}
        />
      ))}

      {hasActive ? (
        <Button variant="ghost" size="sm" onClick={onReset} className="h-9 rounded-xl text-xs">
          <X className="mr-1 h-3 w-3" /> Clear
        </Button>
      ) : null}

      {rightSlot ? <div className="ml-auto flex items-center gap-2">{rightSlot}</div> : null}
    </div>
  );
}

function FilterControl({
  field,
  value,
  onChange,
}: {
  field: FilterField;
  value: string;
  onChange: (next: string) => void;
}) {
  if (field.type === "select") {
    return (
      <label className="flex items-center gap-1 text-xs text-muted-foreground">
        <span className="sr-only">{field.label}</span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 rounded-xl border border-input bg-background px-2 text-sm text-foreground"
        >
          <option value="">{field.label}: All</option>
          {field.options?.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>
    );
  }
  if (field.type === "date") {
    return (
      <label className="flex items-center gap-1 text-xs text-muted-foreground">
        <span>{field.label}</span>
        <input
          type="date"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="h-9 rounded-xl border border-input bg-background px-2 text-sm text-foreground"
        />
      </label>
    );
  }
  return (
    <Input
      value={value}
      placeholder={field.placeholder ?? field.label}
      onChange={(event) => onChange(event.target.value)}
      className="h-9 w-40 rounded-xl text-sm"
    />
  );
}

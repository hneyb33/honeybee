"use client";

import React from "react";
import { Check } from "lucide-react";

/**
 * Shared form primitives for the provider onboarding wizard.
 *
 * They lived inside `page.tsx` next to 700 lines of step markup. Keeping them
 * here lets every step file render identical controls and lets the wizard shell
 * stay focused on navigation and persistence.
 */

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-semibold">{label}</label>
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {children}
    </div>
  );
}

export function SelectInput({
  value,
  onChange,
  className,
  children,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(event) => onChange(event.target.value)}
      className={`h-11 w-full rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 ${className ?? ""}`}
    >
      {children}
    </select>
  );
}

export function RadioGroup({
  value,
  onChange,
  options,
  labels = options,
  name,
}: {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  labels?: string[];
  name?: string;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option, index) => (
        <label
          key={option}
          className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition ${
            value === option
              ? "border-airbnb-coral bg-rose-50 text-foreground dark:bg-rose-950/20"
              : "border-border hover:border-foreground/40"
          }`}
        >
          <input
            type="radio"
            name={name ?? `choice-${options.join("-")}`}
            checked={value === option}
            onChange={() => onChange(option)}
            className="accent-airbnb-coral"
          />
          {labels[index]}
        </label>
      ))}
    </div>
  );
}

export function CheckboxGrid({
  options,
  selected,
  onToggle,
  columns = 2,
}: {
  options: string[];
  selected: string[];
  onToggle: (value: string) => void;
  columns?: number;
}) {
  return (
    <div className={`grid grid-cols-2 gap-2 ${columns === 4 ? "sm:grid-cols-4" : "sm:grid-cols-2"}`}>
      {options.map((option) => (
        <label
          key={option}
          className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-sm transition ${
            selected.includes(option)
              ? "border-airbnb-coral bg-rose-50 dark:bg-rose-950/20"
              : "border-border hover:border-foreground/40"
          }`}
        >
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => onToggle(option)}
            className="h-4 w-4 accent-airbnb-coral"
          />
          <span>{option}</span>
        </label>
      ))}
    </div>
  );
}

export function ReviewRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex gap-3 rounded-2xl border border-border p-4">
      <span className="mt-0.5 text-airbnb-coral">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 break-words text-sm font-medium">{value}</p>
      </div>
    </div>
  );
}

export function InlineAlert({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
      {children}
    </p>
  );
}

/**
 * Progress header for the wizard. Completed steps become clickable so a provider
 * can jump back without walking the whole form again.
 */
export function Stepper({
  steps,
  currentStep,
  onJumpTo,
  disabled,
}: {
  steps: string[];
  currentStep: number;
  onJumpTo?: (step: number) => void;
  disabled?: boolean;
}) {
  const percent = Math.round(((currentStep + 1) / steps.length) * 100);

  return (
    <div className="mb-7">
      <div className="mb-2 flex items-center justify-between gap-4 text-xs font-semibold">
        <span className="uppercase tracking-wide text-muted-foreground">
          Step {currentStep + 1} of {steps.length}
        </span>
        <span className="text-airbnb-coral">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-airbnb-coral transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
      <div className="mt-4 hidden grid-cols-5 gap-2 sm:grid">
        {steps.map((step, index) => {
          const reachable = index <= currentStep;
          return (
            <button
              key={step}
              type="button"
              disabled={!reachable || index === currentStep || disabled}
              onClick={() => reachable && index !== currentStep && onJumpTo?.(index)}
              className={`text-left text-[11px] ${
                index <= currentStep ? "font-semibold text-foreground" : "text-muted-foreground"
              } ${reachable && index !== currentStep && onJumpTo ? "cursor-pointer hover:underline" : "cursor-default"}`}
            >
              <span
                className={`mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full ${
                  index < currentStep
                    ? "bg-emerald-600 text-white"
                    : index === currentStep
                      ? "bg-airbnb-coral text-white"
                      : "bg-muted"
                }`}
              >
                {index < currentStep ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              {step}
            </button>
          );
        })}
      </div>
    </div>
  );
}

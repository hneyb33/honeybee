/**
 * Single source of truth for the age-verification decision.
 *
 * The value is deliberately tri-state: `"true"` (entered), `"denied"`
 * (the visitor admitted to being under 18 - the site stays locked with the
 * reminder screen across visits), and absent (no decision yet - show the
 * gate). Everything that reads or writes the decision goes through these
 * helpers so the gate overlay and the /age-check route can never drift.
 */

export const AGE_VERIFICATION_KEY = "honeybee_age_verified";

export type AgeDecision = "verified" | "denied" | null;

export function readAgeDecision(): AgeDecision {
  try {
    const value = localStorage.getItem(AGE_VERIFICATION_KEY);
    if (value === "true") return "verified";
    if (value === "denied") return "denied";
    return null;
  } catch {
    // Private-mode storage failures must never lock the site open or shut:
    // no persistence means the gate honestly re-asks every visit.
    return null;
  }
}

export function markAgeVerified(): void {
  try {
    localStorage.setItem(AGE_VERIFICATION_KEY, "true");
  } catch {
    // Ignore: the confirmation simply will not persist to the next visit.
  }
}

export function markAgeDenied(): void {
  try {
    localStorage.setItem(AGE_VERIFICATION_KEY, "denied");
  } catch {
    // Ignore: the lock-in just will not survive the next page load.
  }
}

export function clearAgeDecision(): void {
  try {
    localStorage.removeItem(AGE_VERIFICATION_KEY);
  } catch {
    // Ignore.
  }
}

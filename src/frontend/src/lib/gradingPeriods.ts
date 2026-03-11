// ─── Grading Periods ──────────────────────────────────────────────────────────
// Shared grading periods used by Gradebook and Report Cards.
// Defaults: Q1–Q4. Custom periods stored in localStorage.

const GRADING_PERIODS_KEY = "edunite_grading_periods";

export interface GradingPeriod {
  id: string;
  label: string;
  startDate: string;
  endDate: string;
}

const DEFAULT_PERIODS: GradingPeriod[] = [
  { id: "q1", label: "Q1", startDate: "2025-09-01", endDate: "2025-11-15" },
  { id: "q2", label: "Q2", startDate: "2025-11-16", endDate: "2026-01-15" },
  { id: "q3", label: "Q3", startDate: "2026-01-16", endDate: "2026-03-15" },
  { id: "q4", label: "Q4", startDate: "2026-03-16", endDate: "2026-06-15" },
];

export function getGradingPeriods(): GradingPeriod[] {
  try {
    const raw = localStorage.getItem(GRADING_PERIODS_KEY);
    if (!raw) return DEFAULT_PERIODS;
    const stored = JSON.parse(raw) as GradingPeriod[];
    return stored.length > 0 ? stored : DEFAULT_PERIODS;
  } catch {
    return DEFAULT_PERIODS;
  }
}

export function getCurrentPeriod(): GradingPeriod {
  const periods = getGradingPeriods();
  const today = new Date();
  const current = periods.find((p) => {
    const start = new Date(p.startDate);
    const end = new Date(p.endDate);
    return today >= start && today <= end;
  });
  return current ?? periods[periods.length - 1] ?? DEFAULT_PERIODS[3];
}

export function saveGradingPeriods(periods: GradingPeriod[]): void {
  localStorage.setItem(GRADING_PERIODS_KEY, JSON.stringify(periods));
}

// ─── Grade Finalization ────────────────────────────────────────────────────────

const FINALIZED_PERIODS_KEY = "edunite_finalized_periods";

export function getFinalizedPeriods(): string[] {
  try {
    const raw = localStorage.getItem(FINALIZED_PERIODS_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as string[];
  } catch {
    return [];
  }
}

export function finalizePeriod(periodId: string): void {
  const current = getFinalizedPeriods();
  if (!current.includes(periodId)) {
    localStorage.setItem(
      FINALIZED_PERIODS_KEY,
      JSON.stringify([...current, periodId]),
    );
  }
}

export function isPeriodFinalized(periodId: string): boolean {
  return getFinalizedPeriods().includes(periodId);
}

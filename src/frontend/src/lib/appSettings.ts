// ─── Shared App Settings Reader ────────────────────────────────────────────────
// Read-only helpers for consuming app settings (stored by Settings.tsx) in other modules.

const STORAGE_KEY = "edunite_settings";

export interface GradingScale {
  A: number;
  B: number;
  C: number;
  D: number;
}

export interface AppSettings {
  teacherName: string;
  schoolName: string;
  schoolYear: string;
  gradingScale: GradingScale;
  defaultGradeLevel: string;
  defaultPeriod: string;
  dateFormat: string;
  reduceMotion: boolean;
  highContrast: boolean;
}

const DEFAULT_GRADING_SCALE: GradingScale = { A: 90, B: 80, C: 70, D: 60 };

export function getGradingScale(): GradingScale {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_GRADING_SCALE;
    const parsed = JSON.parse(raw) as Partial<AppSettings>;
    return parsed.gradingScale ?? DEFAULT_GRADING_SCALE;
  } catch {
    return DEFAULT_GRADING_SCALE;
  }
}

/**
 * Returns the letter grade for a given percentage using the stored grading scale.
 */
export function getLetterGradeFromScale(
  pct: number | null,
  scale?: GradingScale,
): string {
  if (pct === null) return "—";
  const s = scale ?? getGradingScale();
  if (pct >= s.A) return "A";
  if (pct >= s.B) return "B";
  if (pct >= s.C) return "C";
  if (pct >= s.D) return "D";
  return "F";
}

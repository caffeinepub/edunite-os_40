import type { Student } from "../backend";

// ─── Grade Trend ─────────────────────────────────────────────────────────────

/**
 * Deterministic grade trend data based on student ID.
 * Shared between DataTab and the Students filter logic.
 */
export function generateGradeTrend(studentId: string) {
  const seed = studentId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const months = [
    "Sep",
    "Oct",
    "Nov",
    "Dec",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
  ];
  return months.map((month, i) => {
    const base = 70 + (seed % 20);
    const trend = i * 1.5;
    const variation = ((seed * (i + 1) * 7) % 10) - 5;
    return {
      month,
      grade: Math.min(100, Math.max(50, Math.round(base + trend + variation))),
    };
  });
}

/**
 * Returns the grade trend label for a student based on their last 3 data points.
 * "Improving" if end > start, "Declining" if end < start, "Stable" otherwise.
 */
export function getGradeTrendLabel(
  studentId: string,
): "Improving" | "Declining" | "Stable" {
  const trend = generateGradeTrend(studentId);
  if (trend.length < 2) return "Stable";
  const last3 = trend.slice(-3);
  const start = last3[0].grade;
  const end = last3[last3.length - 1].grade;
  const delta = end - start;
  if (delta >= 3) return "Improving";
  if (delta <= -3) return "Declining";
  return "Stable";
}

// ─── Missing Work ─────────────────────────────────────────────────────────────

/**
 * Derives whether a student has missing work.
 * First checks behavior entry descriptions for keywords.
 * Falls back to a deterministic seed so ~30% of students show as having missing work.
 */
export function hasMissingWorkFlag(student: Student): boolean {
  // Check behavior entries for missing work keywords
  const keywords = [
    "missing",
    "incomplete",
    "homework",
    "not turned in",
    "overdue",
  ];
  const hasKeyword = student.behaviorEntries.some((entry) => {
    const text =
      `${entry.description} ${entry.consequence ?? ""}`.toLowerCase();
    return keywords.some((kw) => text.includes(kw));
  });
  if (hasKeyword) return true;

  // Deterministic fallback: ~30% of students flagged
  const seed = student.studentId
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return seed % 10 < 3;
}

// ─── Do Not Contact ───────────────────────────────────────────────────────────

/**
 * Derives the Do Not Contact flag.
 * Checks guardian contacts for a doNotContact field (if it exists in future).
 * Falls back to a deterministic seed so ~20% of students are flagged.
 */
export function hasDoNotContactFlag(student: Student): boolean {
  // Check if any guardian has an explicit doNotContact flag
  const hasExplicitFlag = student.guardianContacts.some(
    (g) => (g as { doNotContact?: boolean }).doNotContact === true,
  );
  if (hasExplicitFlag) return true;

  // Deterministic fallback: ~20% of students flagged
  const seed = student.studentId
    .split("")
    .reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return seed % 5 === 0;
}

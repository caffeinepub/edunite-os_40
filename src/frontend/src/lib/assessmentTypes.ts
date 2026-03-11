const STORAGE_KEY = "edunite_assessment_types";

const DEFAULT_TYPES: string[] = [
  "Quiz",
  "Test",
  "Exam",
  "Performance Task",
  "Lab Report",
  "Project",
  "Presentation",
  "Portfolio",
  "Diagnostic",
  "Benchmark",
];

function loadTypes(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TYPES));
      return [...DEFAULT_TYPES];
    }
    return JSON.parse(raw) as string[];
  } catch {
    return [...DEFAULT_TYPES];
  }
}

function persistTypes(types: string[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(types));
}

export function getAssessmentTypes(): string[] {
  return loadTypes();
}

export function saveAssessmentTypes(types: string[]): void {
  persistTypes(types);
}

export function addAssessmentType(name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return loadTypes();
  const types = loadTypes();
  if (types.includes(trimmed)) return types;
  const next = [...types, trimmed];
  persistTypes(next);
  return next;
}

export function deleteAssessmentType(name: string): string[] {
  const types = loadTypes();
  const next = types.filter((t) => t !== name);
  persistTypes(next);
  return next;
}

export function reorderAssessmentTypes(types: string[]): string[] {
  persistTypes(types);
  return types;
}

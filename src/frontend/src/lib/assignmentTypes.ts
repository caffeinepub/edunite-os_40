const STORAGE_KEY = "edunite_assignment_types";

const DEFAULT_TYPES: string[] = [
  "Practice",
  "Graded",
  "Writing",
  "Project",
  "Formative",
  "Summative",
  "Homework",
  "Classwork",
  "Lab",
  "Presentation",
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

export function getAssignmentTypes(): string[] {
  return loadTypes();
}

export function saveAssignmentTypes(types: string[]): void {
  persistTypes(types);
}

export function addType(name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return loadTypes();
  const types = loadTypes();
  if (types.includes(trimmed)) return types;
  const next = [...types, trimmed];
  persistTypes(next);
  return next;
}

export function deleteType(name: string): string[] {
  const types = loadTypes();
  const next = types.filter((t) => t !== name);
  persistTypes(next);
  return next;
}

export function reorderTypes(types: string[]): string[] {
  persistTypes(types);
  return types;
}

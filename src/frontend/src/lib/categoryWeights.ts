// ─── Category Weights ──────────────────────────────────────────────────────────
// Global weights: legacy/default, stored as Record<typeName, weight>
// Per-class weights: stored as Record<className, Record<typeName, weight>>

const GLOBAL_KEY = "edunite_category_weights";
const CLASS_WEIGHTS_KEY = "edunite_class_weights";

export type CategoryWeights = Record<string, number>; // typeName -> weight (0–100)
type AllClassWeights = Record<string, CategoryWeights>; // className -> weights

// ── Global (legacy/default) ───────────────────────────────────────────────────
export function getCategoryWeights(): CategoryWeights {
  try {
    const raw = localStorage.getItem(GLOBAL_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as CategoryWeights;
  } catch {
    return {};
  }
}

export function saveCategoryWeights(weights: CategoryWeights): void {
  localStorage.setItem(GLOBAL_KEY, JSON.stringify(weights));
}

// ── Per-class ─────────────────────────────────────────────────────────────────
function loadAllClassWeights(): AllClassWeights {
  try {
    const raw = localStorage.getItem(CLASS_WEIGHTS_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as AllClassWeights;
  } catch {
    return {};
  }
}

export function getClassWeights(className: string): CategoryWeights | null {
  const all = loadAllClassWeights();
  return all[className] ?? null;
}

export function saveClassWeights(
  className: string,
  weights: CategoryWeights,
): void {
  const all = loadAllClassWeights();
  all[className] = weights;
  localStorage.setItem(CLASS_WEIGHTS_KEY, JSON.stringify(all));
}

/**
 * Returns weights for a given set of types.
 * If className is provided and has class-specific weights, use those.
 * Otherwise fall back to global weights.
 * Types not present in weights get 0.
 */
export function getWeightsForTypes(
  types: string[],
  className?: string,
): CategoryWeights {
  const base: CategoryWeights =
    (className ? getClassWeights(className) : null) ?? getCategoryWeights();
  const result: CategoryWeights = {};
  for (const t of types) {
    result[t] = base[t] ?? 0;
  }
  return result;
}

/**
 * Evenly distribute 100% across the given types (rounded to integers, remainder on last).
 */
export function autoBalanceWeights(types: string[]): CategoryWeights {
  if (types.length === 0) return {};
  const base = Math.floor(100 / types.length);
  const remainder = 100 - base * types.length;
  const result: CategoryWeights = {};
  types.forEach((t, i) => {
    result[t] = base + (i === types.length - 1 ? remainder : 0);
  });
  return result;
}

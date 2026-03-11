// ─── Categorized Comment Bank ─────────────────────────────────────────────────
// localStorage-backed store for teacher comments organized by category.

const COMMENT_BANK_KEY = "edunite_comment_bank";

export type CommentCategory =
  | "Academic"
  | "Behavior"
  | "Attendance"
  | "Effort"
  | "Other";

export const COMMENT_CATEGORIES: CommentCategory[] = [
  "Academic",
  "Behavior",
  "Attendance",
  "Effort",
  "Other",
];

export interface BankComment {
  id: number;
  text: string;
  category: CommentCategory;
  createdAt: number;
}

const SEED_COMMENTS: Omit<BankComment, "id" | "createdAt">[] = [
  // Academic
  {
    category: "Academic",
    text: "Demonstrates strong understanding of course material",
  },
  { category: "Academic", text: "Consistently submits high-quality work" },
  {
    category: "Academic",
    text: "Has shown significant improvement this period",
  },
  {
    category: "Academic",
    text: "Needs to focus on completing assignments on time",
  },
  {
    category: "Academic",
    text: "Struggles with key concepts — additional support recommended",
  },
  // Behavior
  { category: "Behavior", text: "Respectful and cooperative in class" },
  {
    category: "Behavior",
    text: "Is a positive contributor to class discussions",
  },
  {
    category: "Behavior",
    text: "Has had some behavioral concerns that need addressing",
  },
  {
    category: "Behavior",
    text: "Works well with peers during group activities",
  },
  // Attendance
  { category: "Attendance", text: "Has maintained excellent attendance" },
  {
    category: "Attendance",
    text: "Frequent absences are impacting academic progress",
  },
  { category: "Attendance", text: "Tardiness has been a concern this period" },
  // Effort
  { category: "Effort", text: "Consistently puts forth excellent effort" },
  { category: "Effort", text: "Shows strong work ethic and self-motivation" },
  { category: "Effort", text: "Could put forth more consistent effort" },
  { category: "Effort", text: "Makes good use of available resources" },
];

function loadBank(): BankComment[] {
  try {
    const raw = localStorage.getItem(COMMENT_BANK_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as BankComment[];
  } catch {
    return [];
  }
}

function persistBank(comments: BankComment[]): void {
  localStorage.setItem(COMMENT_BANK_KEY, JSON.stringify(comments));
}

function ensureSeeded(): BankComment[] {
  const existing = loadBank();
  if (existing.length > 0) return existing;
  const seeded = SEED_COMMENTS.map((s, i) => ({
    ...s,
    id: Date.now() + i,
    createdAt: Date.now() + i,
  }));
  persistBank(seeded);
  return seeded;
}

export function getBankComments(): BankComment[] {
  return ensureSeeded();
}

export function getBankCommentsByCategory(
  category: CommentCategory,
): BankComment[] {
  return ensureSeeded().filter((c) => c.category === category);
}

export function addBankComment(
  text: string,
  category: CommentCategory,
): BankComment {
  const all = ensureSeeded();
  const comment: BankComment = {
    id: Date.now(),
    text: text.trim(),
    category,
    createdAt: Date.now(),
  };
  persistBank([...all, comment]);
  return comment;
}

export function deleteBankComment(id: number): void {
  persistBank(loadBank().filter((c) => c.id !== id));
}

// ─── Comment Library ───────────────────────────────────────────────────────────
// localStorage-backed store for shared teacher comments used in Progress Reports
// and Report Cards.

const COMMENT_LIBRARY_KEY = "edunite_comment_library";

export interface SavedComment {
  id: number;
  text: string;
  createdAt: number;
}

export function getComments(): SavedComment[] {
  try {
    const raw = localStorage.getItem(COMMENT_LIBRARY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedComment[];
  } catch {
    return [];
  }
}

export function saveComment(text: string): SavedComment {
  const comments = getComments();
  const newComment: SavedComment = {
    id: Date.now(),
    text: text.trim(),
    createdAt: Date.now(),
  };
  const updated = [...comments, newComment];
  localStorage.setItem(COMMENT_LIBRARY_KEY, JSON.stringify(updated));
  return newComment;
}

export function deleteComment(id: number): void {
  const comments = getComments().filter((c) => c.id !== id);
  localStorage.setItem(COMMENT_LIBRARY_KEY, JSON.stringify(comments));
}

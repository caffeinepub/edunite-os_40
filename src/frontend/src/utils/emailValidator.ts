/**
 * Returns true if the value is a valid email address or empty (optional field).
 */
export function validateEmail(value: string): boolean {
  if (!value.trim()) return true; // empty is valid (field is optional)
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

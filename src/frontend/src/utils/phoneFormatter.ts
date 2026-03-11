/**
 * Formats a raw phone string into (XXX) XXX-XXXX as the user types.
 * Strips all non-digit characters first, then applies the mask.
 */
export function formatPhoneNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  if (digits.length === 0) return "";
  if (digits.length <= 3) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/**
 * Returns true if the value contains exactly 10 digits (a complete US phone number).
 */
export function validatePhoneNumber(value: string): boolean {
  if (!value.trim()) return true; // empty is valid (field is optional)
  const digits = value.replace(/\D/g, "");
  return digits.length === 10;
}

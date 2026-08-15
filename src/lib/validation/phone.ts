/**
 * Afghan phone number validation.
 * Accepted formats: 07XXXXXXXX, +937XXXXXXXX, 00937XXXXXXXX.
 * Spaces and dashes are stripped before checking.
 */
const AF_PHONE_RE = /^(?:\+93|0093|0)7\d{8}$/;

export function normalizeAfghanPhone(input: string): string {
  return input.replace(/[\s-]/g, '');
}

export function isValidAfghanPhone(input: string): boolean {
  return AF_PHONE_RE.test(normalizeAfghanPhone(input));
}

export function toE164AfghanPhone(input: string): string | null {
  const n = normalizeAfghanPhone(input);
  if (!isValidAfghanPhone(n)) return null;
  if (n.startsWith('+93')) return n;
  if (n.startsWith('0093')) return `+93${n.slice(4)}`;
  if (n.startsWith('0')) return `+93${n.slice(1)}`;
  return null;
}

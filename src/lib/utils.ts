import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwind-aware class merger.
 *
 * `clsx` handles conditional class assembly;
 * `twMerge` de-duplicates Tailwind conflicts (e.g. `p-2 p-4` → `p-4`).
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}

/** Format an integer with locale-correct thousands separators. */
export function formatNumber(value: number, locale = 'en-US'): string {
  return new Intl.NumberFormat(locale).format(value);
}

/**
 * Format a price in AFN (افغانی).
 * Displays as: ؋ 25,000
 */
export function formatPrice(amount: number, currency = 'AFN', _locale = 'en-US'): string {
  if (currency === 'AFN') {
    const formatted = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
    return `؋\u00A0${formatted}`;
  }
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(0)}`;
  }
}

/** Truncate a string with an ellipsis if longer than `max`. */
export function truncate(value: string, max = 60): string {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}

/** Safe JSON parse that returns a fallback on error. */
export function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Convert any value to a slug-ish id (used for accessibility). */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Format a datetime string for display.
 * Shows date + time in a human-readable form.
 */
export function formatDateTime(value: string | Date | null | undefined, locale = 'fa-IR'): string {
  if (!value) return '—';
  try {
    const d = typeof value === 'string' ? new Date(value) : value;
    return d.toLocaleDateString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return String(value);
  }
}

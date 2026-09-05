/**
 * Resolves the application base URL for email link generation.
 *
 * Priority: NEXT_PUBLIC_APP_URL → NEXT_PUBLIC_SITE_URL → localhost (dev only).
 *
 * In production, both variables are required and a localhost value is rejected.
 * This is called once at module load time so a misconfiguration is caught at
 * startup rather than producing broken links in transactional emails.
 */
export function resolveAppUrl(): string {
  // SITE_URL is a plain runtime variable (never inlined into bundles), so
  // containers built without NEXT_PUBLIC_* values can still be configured at
  // start. NEXT_PUBLIC_* values remain as build-time fallbacks.
  const raw = (
    process.env.SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    ''
  ).replace(/\/$/, '');

  // Skip strict validation during `next build` (NEXT_PHASE is 'phase-production-build').
  // The URL is only needed at runtime when actually sending emails, not during static analysis.
  const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build';
  if (process.env.NODE_ENV === 'production' && !isBuildPhase) {
    if (!raw || raw.startsWith('http://localhost')) {
      throw new Error(
        '[empire] FATAL: NEXT_PUBLIC_APP_URL (or NEXT_PUBLIC_SITE_URL) must be set ' +
          'to your production domain in production. ' +
          'A localhost fallback is not allowed in production.',
      );
    }
  }

  return raw || 'http://localhost:3000';
}

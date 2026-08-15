/** Strict security headers. Production uses a per-request CSP nonce. */
export interface SecurityHeaderOptions { nonce?: string; }

export function securityHeaders(opts: SecurityHeaderOptions = {}): Record<string, string> {
  const isProd = process.env.NODE_ENV === 'production';
  const extraConnect = (process.env.CSP_CONNECT_EXTRA ?? '').split(/[,\s]+/).filter(Boolean);
  const connectSrc = ["'self'", 'https://api.atomapay.com', ...(isProd ? [] : ['https:', 'wss:']), ...extraConnect].join(' ');

  const scriptSrc = isProd
    ? `script-src 'self' 'nonce-${opts.nonce ?? ''}' 'strict-dynamic' 'report-sample'`
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";

  const csp = [
    "default-src 'self'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
    'img-src \'self\' data: blob: https:',
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    scriptSrc,
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "worker-src 'self' blob:",
    "manifest-src 'self'",
    'upgrade-insecure-requests',
  ].join('; ');

  const headers: Record<string, string> = {
    'Content-Security-Policy': csp,
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), interest-cohort=(), payment=(self)',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-site',
    'X-DNS-Prefetch-Control': 'on',
  };
  if (isProd) headers['Strict-Transport-Security'] = 'max-age=63072000; includeSubDomains; preload';
  return headers;
}

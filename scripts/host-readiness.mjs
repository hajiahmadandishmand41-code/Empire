#!/usr/bin/env node

/**
 * Host-agnostic production readiness gate.
 * Validates the environment contract without printing secret values.
 */
const isProduction = (process.env.NODE_ENV || '').toLowerCase() === 'production';
const required = ['DATABASE_URL', 'AUTH_SECRET', 'NEXT_PUBLIC_SITE_URL'];
const failures = [];

for (const name of required) {
  if (!process.env[name]?.trim()) failures.push(`${name} is required`);
}

if (isProduction) {
  if ((process.env.NEXT_PUBLIC_SITE_URL || '').trim() && !/^https:\/\//i.test(process.env.NEXT_PUBLIC_SITE_URL.trim())) {
    failures.push('NEXT_PUBLIC_SITE_URL must use HTTPS in production');
  }
  if (process.env.ALLOW_MOCK_AUTH === 'true') failures.push('ALLOW_MOCK_AUTH must be false/unset in production');
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
    failures.push('Production uploads require Cloudinary credentials');
  }
}

const origin = process.env.NEXT_PUBLIC_SITE_URL?.trim();
if (origin) {
  try { new URL(origin); } catch { failures.push('NEXT_PUBLIC_SITE_URL is not a valid URL'); }
}

if (!failures.length) {
  console.log(JSON.stringify({ ok: true, production: isProduction, checks: required }, null, 2));
  process.exit(0);
}

console.error(JSON.stringify({ ok: false, production: isProduction, failures }, null, 2));
process.exit(1);

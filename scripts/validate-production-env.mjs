#!/usr/bin/env node
/** Strict production startup validation. Never prints secret values. */

const required = [
  'DATABASE_URL',
  'AUTH_SECRET',
  'NEXT_PUBLIC_SITE_URL',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'ATOMA_PAY_BASE_URL',
  'ATOMA_PAY_MERCHANT_ID',
  'ATOMA_PAY_API_KEY',
  'ATOMA_PAY_WEBHOOK_SECRET',
  'ATOMA_PAY_CREATE_PATH',
  'ATOMA_PAY_STATUS_PATH',
];

const errors = [];
for (const key of required) {
  if (!process.env[key]?.trim()) errors.push(`${key} is required in production`);
}

if (process.env.ALLOW_MOCK_AUTH === 'true') errors.push('ALLOW_MOCK_AUTH=true is forbidden in production');
if (process.env.CSP_REPORT_ONLY === 'true') errors.push('CSP_REPORT_ONLY=true is forbidden in production');

const authSecret = process.env.AUTH_SECRET ?? '';
if (authSecret.length < 32) errors.push('AUTH_SECRET must be at least 32 characters');

try {
  const url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? '');
  if (url.protocol !== 'https:') errors.push('NEXT_PUBLIC_SITE_URL must use https in production');
} catch {
  errors.push('NEXT_PUBLIC_SITE_URL must be a valid absolute URL');
}

for (const key of ['UPSTASH_REDIS_REST_URL', 'ATOMA_PAY_BASE_URL']) {
  try {
    const url = new URL(process.env[key] ?? '');
    if (!['https:'].includes(url.protocol)) errors.push(`${key} must use https`);
  } catch {
    errors.push(`${key} must be a valid URL`);
  }
}

if (errors.length) {
  console.error('[production-env] startup validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log('[production-env] required production configuration is present');

// @ts-check
/**
 * Empire Shop — Type-safe environment variables via @t3-oss/env-nextjs.
 *
 * All environment variables are validated at build/startup time.
 * Access validated & typed values through `env.SERVER_*` or `env.NEXT_PUBLIC_*`.
 *
 * Set SKIP_ENV_VALIDATION=true to skip validation (e.g. in CI lint-only steps).
 *
 * @see https://env.t3.gg
 */

import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  // ── Server-only (never exposed to the browser) ─────────────────────
  server: {
    /** Primary PostgreSQL connection string (pooled on Vercel). */
    DATABASE_URL: z.string().url().optional(),
    /** Direct / non-pooled connection for migrations. */
    DATABASE_URL_UNPOOLED: z.string().url().optional(),
    /**
     * HMAC-SHA256 signing key for session cookies.
     * Minimum 32 random characters — enforced at runtime in production.
     */
    AUTH_SECRET: z.string().min(1).optional(),
    /** Runtime site URL override (wins over NEXT_PUBLIC_SITE_URL on the server). */
    SITE_URL: z.string().url().optional(),
    /** Legacy NextAuth secret (optional; project uses custom HMAC auth). */
    NEXTAUTH_SECRET: z.string().optional(),
    /** Seed script admin password. */
    ADMIN_SEED_PASSWORD: z.string().optional(),

    // ── Atoma Pay (payment gateway) ──────────────────────────────────
    ATOMA_PAY_BASE_URL: z.string().url().optional(),
    ATOMA_PAY_CREATE_PATH: z.string().default('/v1/payments'),
    ATOMA_PAY_STATUS_PATH: z.string().default('/v1/payments/:id'),
    ATOMA_PAY_MERCHANT_ID: z.string().optional(),
    ATOMA_PAY_API_KEY: z.string().optional(),
    ATOMA_PAY_WEBHOOK_SECRET: z.string().optional(),

    // ── Email (SMTP) ─────────────────────────────────────────────────
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().int().positive().default(587),
    SMTP_SECURE: z
      .enum(['true', 'false'])
      .default('false')
      .transform((v) => v === 'true'),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SMTP_FROM: z.string().optional(),

    // ── SMS (Twilio) ─────────────────────────────────────────────────
    SMS_PROVIDER: z.string().optional(),
    TWILIO_ACCOUNT_SID: z.string().optional(),
    TWILIO_AUTH_TOKEN: z.string().optional(),
    TWILIO_PHONE: z.string().optional(),

    // ── Rate limiting / cache (Upstash Redis) ────────────────────────
    UPSTASH_REDIS_REST_URL: z.string().url().optional(),
    UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
    API_RATE_LIMIT: z.coerce.number().int().positive().default(60),
    API_RATE_WINDOW_MS: z.coerce.number().int().positive().default(60_000),

    // ── Observability / security ─────────────────────────────────────
    METRICS_TOKEN: z.string().optional(),
    CSP_REPORT_ONLY: z.enum(['true', 'false']).optional(),
    CSP_CONNECT_EXTRA: z.string().optional(),
    LOG_LEVEL: z
      .enum(['debug', 'info', 'warn', 'error'])
      .default('info'),

    // ── Cloudinary (optional image storage) ──────────────────────────
    CLOUDINARY_CLOUD_NAME: z.string().optional(),
    CLOUDINARY_API_KEY: z.string().optional(),
    CLOUDINARY_API_SECRET: z.string().optional(),
    CLOUDINARY_UPLOAD_FOLDER: z.string().default('empire-shop'),

    // ── VAPID (web push) ─────────────────────────────────────────────
    VAPID_PUBLIC_KEY: z.string().optional(),

    // ── Build controls ───────────────────────────────────────────────
    SKIP_DB_MIGRATE: z.enum(['1', '0']).optional(),
  },

  // ── Client-side (must be prefixed with NEXT_PUBLIC_) ───────────────
  client: {
    NEXT_PUBLIC_SITE_URL: z.string().url().default('http://localhost:3000'),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_BASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  },

  // ── Runtime values ─────────────────────────────────────────────────
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    DATABASE_URL_UNPOOLED: process.env.DATABASE_URL_UNPOOLED,
    AUTH_SECRET: process.env.AUTH_SECRET,
    SITE_URL: process.env.SITE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    ADMIN_SEED_PASSWORD: process.env.ADMIN_SEED_PASSWORD,
    ATOMA_PAY_BASE_URL: process.env.ATOMA_PAY_BASE_URL,
    ATOMA_PAY_CREATE_PATH: process.env.ATOMA_PAY_CREATE_PATH,
    ATOMA_PAY_STATUS_PATH: process.env.ATOMA_PAY_STATUS_PATH,
    ATOMA_PAY_MERCHANT_ID: process.env.ATOMA_PAY_MERCHANT_ID,
    ATOMA_PAY_API_KEY: process.env.ATOMA_PAY_API_KEY,
    ATOMA_PAY_WEBHOOK_SECRET: process.env.ATOMA_PAY_WEBHOOK_SECRET,
    SMTP_HOST: process.env.SMTP_HOST,
    SMTP_PORT: process.env.SMTP_PORT,
    SMTP_SECURE: process.env.SMTP_SECURE,
    SMTP_USER: process.env.SMTP_USER,
    SMTP_PASS: process.env.SMTP_PASS,
    SMTP_FROM: process.env.SMTP_FROM,
    SMS_PROVIDER: process.env.SMS_PROVIDER,
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE: process.env.TWILIO_PHONE,
    UPSTASH_REDIS_REST_URL: process.env.UPSTASH_REDIS_REST_URL,
    UPSTASH_REDIS_REST_TOKEN: process.env.UPSTASH_REDIS_REST_TOKEN,
    API_RATE_LIMIT: process.env.API_RATE_LIMIT,
    API_RATE_WINDOW_MS: process.env.API_RATE_WINDOW_MS,
    METRICS_TOKEN: process.env.METRICS_TOKEN,
    CSP_REPORT_ONLY: process.env.CSP_REPORT_ONLY,
    CSP_CONNECT_EXTRA: process.env.CSP_CONNECT_EXTRA,
    LOG_LEVEL: process.env.LOG_LEVEL,
    CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
    CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
    CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
    CLOUDINARY_UPLOAD_FOLDER: process.env.CLOUDINARY_UPLOAD_FOLDER,
    VAPID_PUBLIC_KEY: process.env.VAPID_PUBLIC_KEY,
    SKIP_DB_MIGRATE: process.env.SKIP_DB_MIGRATE,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY,
  },

  /**
   * Treat .mjs as a source file that runs at build time.
   * Server-only values are stripped from the client bundle automatically.
   */
  skipValidation:
    !!process.env.SKIP_ENV_VALIDATION ||
    process.env.npm_lifecycle_event === 'lint' ||
    process.env.npm_lifecycle_event === 'typecheck',
});

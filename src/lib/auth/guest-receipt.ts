import { createHmac, timingSafeEqual } from 'node:crypto';

export const GUEST_RECEIPT_COOKIE_PREFIX = 'empire_guest_receipt_';
const GUEST_RECEIPT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type GuestReceiptPayload = {
  orderId: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET must be set (min 32 chars) in production.');
    }
    return 'dev-insecure-secret-change-me-please-32b';
  }
  return secret;
}

function encode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64url');
}

function decode(value: string): string | null {
  try {
    return Buffer.from(value, 'base64url').toString('utf8');
  } catch {
    return null;
  }
}

function sign(value: string): string {
  return createHmac('sha256', getSecret()).update(value).digest('base64url');
}

export function guestReceiptCookieName(orderId: string): string {
  return `${GUEST_RECEIPT_COOKIE_PREFIX}${orderId}`;
}

export function createGuestReceiptToken(orderId: string, nowMs = Date.now()): string {
  const payload: GuestReceiptPayload = {
    orderId,
    exp: Math.floor(nowMs / 1000) + GUEST_RECEIPT_MAX_AGE_SECONDS,
  };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyGuestReceiptToken(token: string | undefined, expectedOrderId: string): boolean {
  if (!token) return false;
  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return false;

  const expectedSignature = sign(encodedPayload);
  const actual = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return false;

  const decoded = decode(encodedPayload);
  if (!decoded) return false;

  try {
    const payload: unknown = JSON.parse(decoded);
    if (typeof payload !== 'object' || payload === null) return false;
    const record = payload as Record<string, unknown>;
    return (
      record.orderId === expectedOrderId &&
      typeof record.exp === 'number' &&
      Number.isInteger(record.exp) &&
      record.exp > Math.floor(Date.now() / 1000)
    );
  } catch {
    return false;
  }
}

export function guestReceiptCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: GUEST_RECEIPT_MAX_AGE_SECONDS,
  };
}

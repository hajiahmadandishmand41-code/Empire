/**
 * Signed, HTTP-only session cookie.
 * Payload: base64url(JSON({ uid, iat, iatMs, exp })) + '.' + base64url(HMAC-SHA256)
 *
 * `iat` remains second-based for compatibility with existing sessions while
 * `iatMs` preserves the exact issuance time for account-mutation invalidation.
 */
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'empire_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

interface SessionPayload {
  uid: string;
  iat: number;
  iatMs?: number;
  exp: number;
}

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

export function hasValidAuthSecret(): boolean {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET || process.env.SESSION_SECRET;
  return Boolean(secret?.trim() && secret.trim().length >= 32);
}

function b64url(value: Buffer | string): string {
  return Buffer.from(value).toString('base64url');
}

function fromB64url(value: string): Buffer {
  return Buffer.from(value, 'base64url');
}

function sign(payloadB64: string): string {
  return createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

function isSessionPayload(value: unknown): value is SessionPayload {
  if (typeof value !== 'object' || value === null) return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.uid === 'string' &&
    record.uid.length > 0 &&
    typeof record.iat === 'number' &&
    Number.isInteger(record.iat) &&
    (record.iatMs === undefined ||
      (typeof record.iatMs === 'number' && Number.isInteger(record.iatMs) && record.iatMs > 0)) &&
    typeof record.exp === 'number' &&
    Number.isInteger(record.exp)
  );
}

export function encodeSession(uid: string, nowMs = Date.now()): string {
  const iat = Math.floor(nowMs / 1000);
  const exp = iat + MAX_AGE_SECONDS;
  const payload: SessionPayload = { uid, iat, iatMs: nowMs, exp };
  const encoded = b64url(JSON.stringify(payload));
  return `${encoded}.${sign(encoded)}`;
}

export function decodeSession(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  if (!payloadB64 || !signature) return null;

  const expected = sign(payloadB64);
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expected);
  if (actualBytes.length !== expectedBytes.length || !timingSafeEqual(actualBytes, expectedBytes)) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(fromB64url(payloadB64).toString('utf8'));
    if (!isSessionPayload(parsed)) return null;
    if (parsed.iat <= 0 || parsed.exp <= parsed.iat || parsed.exp * 1000 < Date.now()) return null;
    return parsed;
  } catch {
    return null;
  }
}

export async function setSessionCookie(uid: string): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, encodeSession(uid), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

export async function readSessionPayload(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return token ? decodeSession(token) : null;
}

export async function readSessionUserId(): Promise<string | null> {
  return (await readSessionPayload())?.uid ?? null;
}

export interface SessionPayloadShape {
  userId: string;
  issuedAt: number;
  issuedAtMs: number;
}

export async function getSessionPayload(): Promise<SessionPayloadShape | null> {
  const payload = await readSessionPayload();
  return payload
    ? {
        userId: payload.uid,
        issuedAt: payload.iat,
        issuedAtMs: payload.iatMs ?? payload.iat * 1000,
      }
    : null;
}

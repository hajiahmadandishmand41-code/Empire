/**
 * Signed, HTTP-only session cookie.
 * Payload: base64url(JSON({ uid, iat, exp })) + '.' + base64url(HMAC-SHA256)
 *
 * `iat` is checked against the user's updatedAt timestamp. Any account
 * mutation (including logout, role changes, password changes and admin
 * deactivation) therefore invalidates previously issued session tokens.
 */
import { cookies } from 'next/headers';
import { createHmac, timingSafeEqual } from 'node:crypto';

export const SESSION_COOKIE = 'empire_session';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30; // 30 days

interface SessionPayload {
  uid: string;
  iat: number;
  exp: number;
}

function getSecret(): string {
  const s =
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('AUTH_SECRET must be set (min 32 chars) in production.');
    }
    return 'dev-insecure-secret-change-me-please-32b';
  }
  return s;
}

function b64url(buf: Buffer | string): string {
  return Buffer.from(buf).toString('base64url');
}

function fromB64url(s: string): Buffer {
  return Buffer.from(s, 'base64url');
}

function sign(payloadB64: string): string {
  return createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

export function encodeSession(uid: string, nowMs = Date.now()): string {
  const iat = Math.floor(nowMs / 1000);
  const exp = iat + MAX_AGE_SECONDS;
  const payload: SessionPayload = { uid, iat, exp };
  const p = b64url(JSON.stringify(payload));
  const sig = sign(p);
  return `${p}.${sig}`;
}

export function decodeSession(token: string): SessionPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [p, sig] = parts;
  if (!p || !sig) return null;
  const expected = sign(p);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(fromB64url(p).toString('utf8')) as Partial<SessionPayload>;
    if (!payload?.uid || !Number.isInteger(payload.iat) || !Number.isInteger(payload.exp)) return null;
    if (payload.exp * 1000 < Date.now()) return null;
    if (payload.iat <= 0 || payload.exp <= payload.iat) return null;
    return payload as SessionPayload;
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
  if (!token) return null;
  return decodeSession(token);
}

export async function readSessionUserId(): Promise<string | null> {
  return (await readSessionPayload())?.uid ?? null;
}

export interface SessionPayloadShape {
  userId: string;
  issuedAt: number;
}

export async function getSessionPayload(): Promise<SessionPayloadShape | null> {
  const payload = await readSessionPayload();
  if (!payload) return null;
  return { userId: payload.uid, issuedAt: payload.iat };
}

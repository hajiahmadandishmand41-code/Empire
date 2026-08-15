import { describe, expect, it } from 'vitest';
import { decodeSession, encodeSession } from '../src/lib/auth/session';
import { isApprovedActiveSeller } from '../src/lib/auth/require-seller-api';

describe('session security', () => {
  it('encodes and decodes a signed session with issued-at and expiry', () => {
    const token = encodeSession('user-1', Date.parse('2026-08-15T12:00:00.000Z'));
    const payload = decodeSession(token);

    expect(payload?.uid).toBe('user-1');
    expect(payload?.iat).toBe(Math.floor(Date.parse('2026-08-15T12:00:00.000Z') / 1000));
    expect(payload?.exp).toBe(payload!.iat + 30 * 24 * 60 * 60);
  });

  it('rejects a tampered session signature', () => {
    const token = encodeSession('user-1');
    const tampered = `${token.slice(0, -1)}${token.endsWith('a') ? 'b' : 'a'}`;
    expect(decodeSession(tampered)).toBeNull();
  });
});

describe('seller authorization', () => {
  it('requires an approved active seller', () => {
    expect(isApprovedActiveSeller({ role: 'seller', sellerStatus: 'approved', isActive: true })).toBe(true);
    expect(isApprovedActiveSeller({ role: 'seller', sellerStatus: 'pending', isActive: true })).toBe(false);
    expect(isApprovedActiveSeller({ role: 'seller', sellerStatus: 'rejected', isActive: true })).toBe(false);
    expect(isApprovedActiveSeller({ role: 'seller', sellerStatus: 'none', isActive: true })).toBe(false);
    expect(isApprovedActiveSeller({ role: 'seller', sellerStatus: 'approved', isActive: false })).toBe(false);
    expect(isApprovedActiveSeller({ role: 'customer', sellerStatus: 'approved', isActive: true })).toBe(false);
  });
});

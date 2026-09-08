import { describe, expect, it } from 'vitest';
import { clamp, distSq, hashSeed, normalize, seededRandom } from '../src/core/types';

describe('core math', () => {
  it('clamps values', () => {
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(-2, 0, 10)).toBe(0);
    expect(clamp(4, 0, 10)).toBe(4);
  });

  it('normalizes vectors', () => {
    expect(normalize(3, 4)).toEqual({ x: 0.6, y: 0.8 });
    expect(normalize(0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('computes squared distance without a square root', () => {
    expect(distSq({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(25);
  });

  it('produces deterministic daily seeds', () => {
    expect(hashSeed('2026-09-08')).toBe(hashSeed('2026-09-08'));
    const a = seededRandom(hashSeed('daily'));
    const b = seededRandom(hashSeed('daily'));
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});

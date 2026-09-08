import { describe, expect, it } from 'vitest';
import { Player } from '../src/entities/Entities';
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

describe('player combat core', () => {
  it('moves within arena bounds and exposes dash invulnerability', () => {
    const player = new Player();
    player.reset(100);
    player.update(1, { x: 1, y: 0 }, 1000, 600);
    expect(player.position.x).toBe(972);
    expect(player.dash({ x: 1, y: 0 })).toBe(true);
    expect(player.invulnerable).toBeGreaterThan(0);
  });

  it('blocks damage while invulnerable and applies damage otherwise', () => {
    const player = new Player();
    player.reset(100);
    player.invulnerable = 1;
    expect(player.takeDamage(40)).toBe(false);
    expect(player.hp).toBe(100);
    player.invulnerable = 0;
    expect(player.takeDamage(40)).toBe(true);
    expect(player.hp).toBe(60);
  });
});

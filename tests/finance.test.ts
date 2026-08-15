import { describe, expect, it } from 'vitest';
import { Prisma } from '@prisma/client';
import { computeSplit } from '../src/lib/finance/wallet';

describe('finance Decimal arithmetic', () => {
  it('keeps cents exact without floating point arithmetic', () => {
    const split = computeSplit(new Prisma.Decimal('0.30'), new Prisma.Decimal('10'));
    expect(split.gross.toFixed(2)).toBe('0.30');
    expect(split.commission.toFixed(2)).toBe('0.03');
    expect(split.sellerAmount.toFixed(2)).toBe('0.27');
  });

  it('clamps commission rates using Decimal arithmetic', () => {
    expect(computeSplit('100.00', '150').commission.toFixed(2)).toBe('100.00');
    expect(computeSplit('100.00', '-5').commission.toFixed(2)).toBe('0.00');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { Prisma } from '@prisma/client';
import { ProductService } from '../src/server/services/product.service';
import { computeSplit } from '../src/lib/finance/wallet';

describe('production hardening regressions', () => {
  it('uses exact Decimal math for seller settlement snapshots', () => {
    const split = computeSplit(new Prisma.Decimal('1234.56'), new Prisma.Decimal('12.50'));
    expect(split.gross.toFixed(2)).toBe('1234.56');
    expect(split.commission.toFixed(2)).toBe('154.32');
    expect(split.sellerAmount.toFixed(2)).toBe('1080.24');
  });

  it('never serves inactive products through the public product service', async () => {
    const inactiveRow = { id: 'p1', isActive: false };
    const products = {
      findById: vi.fn().mockResolvedValue(inactiveRow),
      incrementViewCount: vi.fn(),
    };
    const reviews = { summarize: vi.fn() };
    const categories = {};
    const service = new ProductService(products as never, categories as never, reviews as never);
    await expect(service.getProductById('p1')).resolves.toBeNull();
    expect(products.incrementViewCount).not.toHaveBeenCalled();
    expect(reviews.summarize).not.toHaveBeenCalled();
  });
});

import { afterAll, describe, expect, it } from 'vitest';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const shouldRun = Boolean(process.env.DATABASE_URL);

describe.skipIf(!shouldRun)('inventory concurrency', () => {
  it('allows exactly one successful decrement when stock is one', async () => {
    const key = `concurrency-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const category = await prisma.category.create({
      data: {
        key,
        name: `Concurrency ${key}`,
        slug: key,
      },
    });

    const product = await prisma.product.create({
      data: {
        slug: key,
        name: `Concurrency ${key}`,
        shortDescription: 'Concurrency test product',
        description: null,
        price: 100,
        currency: 'AFN',
        region: 'AF',
        inStock: true,
        isActive: true,
        stockQuantity: 1,
        categoryId: category.id,
      },
    });

    try {
      const results = await Promise.all(
        Array.from({ length: 10 }, () =>
          prisma.product.updateMany({
            where: {
              id: product.id,
              isActive: true,
              inStock: true,
              stockQuantity: { gte: 1 },
            },
            data: {
              stockQuantity: { decrement: 1 },
              salesCount: { increment: 1 },
            },
          }),
        ),
      );

      const successful = results.filter((result) => result.count === 1).length;
      const final = await prisma.product.findUniqueOrThrow({ where: { id: product.id } });

      expect(successful).toBe(1);
      expect(final.stockQuantity).toBe(0);
      expect(final.salesCount).toBe(1);
    } finally {
      await prisma.product.delete({ where: { id: product.id } });
      await prisma.category.delete({ where: { id: category.id } });
    }
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

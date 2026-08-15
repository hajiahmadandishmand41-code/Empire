/**
 * Review Repository
 *
 * Abstracts all database access for Review entities.
 * Includes rating summarization and verified-purchase enforcement.
 */

import type { PrismaClient } from '@prisma/client';

export interface ReviewRow {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string | null;
  comment: string | null;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
  user: { id: string; fullName: string };
}

export interface RatingSummary {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

export interface CreateReviewInput {
  productId: string;
  userId: string;
  rating: number;
  title?: string;
  comment?: string;
}

export interface IReviewRepository {
  findByProduct(productId: string, approvedOnly?: boolean): Promise<ReviewRow[]>;
  findByUser(userId: string): Promise<ReviewRow[]>;
  findExistingByUserAndProduct(userId: string, productId: string): Promise<ReviewRow | null>;
  summarize(productId: string): Promise<RatingSummary>;
  summarizeBatch(productIds: string[]): Promise<Map<string, RatingSummary>>;
  upsert(input: CreateReviewInput): Promise<ReviewRow>;
  approve(reviewId: string): Promise<void>;
  delete(reviewId: string): Promise<void>;
  hasVerifiedPurchase(userId: string, productId: string): Promise<boolean>;
}

function buildSummary(rows: Array<{ rating: number }>): RatingSummary {
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of rows) {
    const bucket = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    distribution[bucket] += 1;
    sum += r.rating;
  }
  const count = rows.length;
  const average = count === 0 ? 0 : Math.round((sum / count) * 10) / 10;
  return { average, count, distribution };
}

export class PrismaReviewRepository implements IReviewRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByProduct(productId: string, approvedOnly = true): Promise<ReviewRow[]> {
    const rows = await this.prisma.review.findMany({
      where: { productId, ...(approvedOnly ? { isApproved: true } : {}) },
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return rows as ReviewRow[];
  }

  async findByUser(userId: string): Promise<ReviewRow[]> {
    const rows = await this.prisma.review.findMany({
      where: { userId },
      include: { user: { select: { id: true, fullName: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return rows as ReviewRow[];
  }

  async findExistingByUserAndProduct(
    userId: string,
    productId: string,
  ): Promise<ReviewRow | null> {
    const row = await this.prisma.review.findFirst({
      where: { userId, productId },
      include: { user: { select: { id: true, fullName: true } } },
    });
    return row as ReviewRow | null;
  }

  async summarize(productId: string): Promise<RatingSummary> {
    const rows = await this.prisma.review.findMany({
      where: { productId, isApproved: true },
      select: { rating: true },
    });
    return buildSummary(rows);
  }

  async summarizeBatch(productIds: string[]): Promise<Map<string, RatingSummary>> {
    if (productIds.length === 0) return new Map();

    const rows = await this.prisma.review.groupBy({
      by: ['productId'],
      where: { productId: { in: productIds }, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    });

    const map = new Map<string, RatingSummary>();
    for (const r of rows) {
      const average = Math.round(((r._avg.rating ?? 0) as number) * 10) / 10;
      const count = r._count.rating;
      // Distribution requires individual rows; use approximate values here.
      map.set(r.productId, {
        average,
        count,
        distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      });
    }
    return map;
  }

  async upsert(input: CreateReviewInput): Promise<ReviewRow> {
    const existing = await this.findExistingByUserAndProduct(input.userId, input.productId);
    if (existing) {
      const updated = await this.prisma.review.update({
        where: { id: existing.id },
        data: {
          rating: input.rating,
          title: input.title ?? null,
          comment: input.comment ?? null,
          isApproved: false, // Re-submit goes back to pending moderation.
        },
        include: { user: { select: { id: true, fullName: true } } },
      });
      return updated as ReviewRow;
    }

    const created = await this.prisma.review.create({
      data: {
        productId: input.productId,
        userId: input.userId,
        rating: input.rating,
        title: input.title ?? null,
        comment: input.comment ?? null,
        isApproved: false,
      },
      include: { user: { select: { id: true, fullName: true } } },
    });
    return created as ReviewRow;
  }

  async approve(reviewId: string): Promise<void> {
    await this.prisma.review.update({
      where: { id: reviewId },
      data: { isApproved: true },
    });
  }

  async delete(reviewId: string): Promise<void> {
    await this.prisma.review.delete({ where: { id: reviewId } });
  }

  async hasVerifiedPurchase(userId: string, productId: string): Promise<boolean> {
    const count = await this.prisma.orderItem.count({
      where: {
        productId,
        order: {
          userId,
          status: { in: ['shipped', 'delivered'] },
        },
      },
    });
    return count > 0;
  }
}

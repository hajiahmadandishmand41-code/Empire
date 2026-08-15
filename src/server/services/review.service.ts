/**
 * Review Service — Business Logic Layer
 *
 * Manages product reviews with verified-purchase enforcement,
 * upsert logic (user can update their existing review), and
 * rating aggregation.
 */

import type { IReviewRepository, ReviewRow, RatingSummary, CreateReviewInput } from '../repositories/review.repository';
import { ForbiddenError, NotFoundError } from '../infrastructure/errors';

export class ReviewService {
  constructor(private readonly reviews: IReviewRepository) {}

  async listByProduct(
    productId: string,
    approvedOnly = true,
  ): Promise<{ reviews: ReviewRow[]; summary: RatingSummary }> {
    const [reviewList, summary] = await Promise.all([
      this.reviews.findByProduct(productId, approvedOnly),
      this.reviews.summarize(productId),
    ]);
    return { reviews: reviewList, summary };
  }

  /**
   * Submit or update a review for a product.
   * Enforces verified-purchase requirement.
   */
  async submitReview(
    input: CreateReviewInput & { requireVerifiedPurchase?: boolean },
  ): Promise<ReviewRow> {
    if (input.requireVerifiedPurchase !== false) {
      const hasPurchase = await this.reviews.hasVerifiedPurchase(
        input.userId,
        input.productId,
      );
      if (!hasPurchase) {
        throw new ForbiddenError(
          'برای ثبت نظر باید این محصول را خریداری و دریافت کرده باشید.',
        );
      }
    }

    return this.reviews.upsert(input);
  }

  async approve(reviewId: string): Promise<void> {
    await this.reviews.approve(reviewId);
  }

  async delete(reviewId: string): Promise<void> {
    await this.reviews.delete(reviewId);
  }
}

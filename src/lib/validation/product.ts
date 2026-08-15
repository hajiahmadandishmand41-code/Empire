/**
 * Server-side validation for product-list query params.
 *
 * Phase 6+: extended with rich shopping filters.
 *   - price range (min / max)
 *   - seller filter
 *   - stock filter (inStock=true|false)
 *   - extended sort keys: newest, priceAsc, priceDesc, bestSelling, mostViewed, popular, featured
 *   - featured filter
 *   - discount filter (hasDiscount=true)
 *   - minimum rating filter (minRating)
 *   - isTraditional filter for Afghan traditional products
 */
import { z } from 'zod';

export const productListQuerySchema = z
  .object({
    q: z.string().trim().max(200).optional(),
    categoryKey: z.string().trim().max(80).optional(),
    sellerId: z.string().trim().max(80).optional(),
    priceMin: z.coerce.number().nonnegative().max(1_000_000).optional(),
    priceMax: z.coerce.number().nonnegative().max(1_000_000).optional(),
    inStock: z
      .union([z.literal('true'), z.literal('false'), z.boolean()])
      .transform((v) => v === true || v === 'true')
      .optional(),
    featured: z
      .union([z.literal('true'), z.literal('false'), z.boolean()])
      .transform((v) => v === true || v === 'true')
      .optional(),
    hasDiscount: z
      .union([z.literal('true'), z.literal('false'), z.boolean()])
      .transform((v) => v === true || v === 'true')
      .optional(),
    isTraditional: z
      .union([z.literal('true'), z.literal('false'), z.boolean()])
      .transform((v) => v === true || v === 'true')
      .optional(),
    minRating: z.coerce.number().min(0).max(5).optional(),
    badge: z.string().trim().max(40).optional(),
    brand: z.string().trim().max(80).optional(),
    page: z.coerce.number().int().positive().max(1000).optional(),
    pageSize: z.coerce.number().int().positive().max(100).optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    sort: z
      .enum([
        'recommended',
        'newest',
        'priceAsc',
        'priceDesc',
        'bestSelling',
        'bestseller',  // alias for bestSelling (backward compat)
        'mostViewed',
        'popular',
        'featured',
      ])
      .optional(),
  })
  .refine(
    (v) => v.priceMin === undefined || v.priceMax === undefined || v.priceMin <= v.priceMax,
    { message: 'priceMin must be <= priceMax', path: ['priceMin'] },
  );

export type ProductListQuery = z.infer<typeof productListQuerySchema>;

export const productSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9-]+$/i, 'Invalid slug — only letters, numbers, and hyphens allowed');

// ── Review & wishlist schemas ─────────────────────────────────────────────────

export const reviewCreateSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().trim().max(120).optional().or(z.literal('').transform(() => undefined)),
  comment: z.string().trim().max(2000).optional().or(z.literal('').transform(() => undefined)),
});
export type ReviewCreateInput = z.infer<typeof reviewCreateSchema>;

export const wishlistAddSchema = z
  .object({
    productId: z.string().trim().min(1).max(80).optional(),
    slug: productSlugSchema.optional(),
  })
  .refine((v) => v.productId || v.slug, {
    message: 'productId or slug is required',
    path: ['productId'],
  });
export type WishlistAddInput = z.infer<typeof wishlistAddSchema>;

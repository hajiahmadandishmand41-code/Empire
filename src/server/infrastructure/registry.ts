/**
 * Service Registry — DI Container Setup
 *
 * Registers all repositories and services into the global DI container.
 * This is the single place where the concrete implementations are wired
 * to their interfaces. Changing implementations (e.g. adding caching,
 * switching from Prisma to another ORM) only requires edits here.
 *
 * Call bootstrapContainer() once at application startup (or lazily on
 * first use). It is idempotent — calling it multiple times is safe.
 *
 * Usage in Next.js Route Handlers:
 *   import { getProductService } from '@/server/infrastructure/registry';
 *   const svc = getProductService();
 */

import { container, TOKENS } from './container';
import { prisma } from '@/lib/db';
import { PrismaProductRepository } from '../repositories/product.repository';
import { PrismaCategoryRepository } from '../repositories/category.repository';
import { PrismaReviewRepository } from '../repositories/review.repository';
import { PrismaSellerRepository } from '../repositories/seller.repository';
import { ProductService } from '../services/product.service';
import { SearchService } from '../services/search.service';

let initialized = false;

/** Wire all repositories and services. Idempotent. */
export function bootstrapContainer(): void {
  if (initialized) return;
  initialized = true;

  // ── Repositories ─────────────────────────────────────────────────────────────
  container.register(
    TOKENS.ProductRepository,
    () => new PrismaProductRepository(prisma),
  );

  container.register(
    TOKENS.CategoryRepository,
    () => new PrismaCategoryRepository(prisma),
  );

  container.register(
    TOKENS.ReviewRepository,
    () => new PrismaReviewRepository(prisma),
  );

  container.register(
    TOKENS.SellerRepository,
    () => new PrismaSellerRepository(prisma),
  );

  // ── Services ─────────────────────────────────────────────────────────────────
  container.register(TOKENS.ProductService, () => {
    const products = container.resolve<PrismaProductRepository>(TOKENS.ProductRepository);
    const categories = container.resolve<PrismaCategoryRepository>(TOKENS.CategoryRepository);
    const reviews = container.resolve<PrismaReviewRepository>(TOKENS.ReviewRepository);
    return new ProductService(products, categories, reviews);
  });

  container.register(TOKENS.SearchService, () => {
    const products = container.resolve<PrismaProductRepository>(TOKENS.ProductRepository);
    const categories = container.resolve<PrismaCategoryRepository>(TOKENS.CategoryRepository);
    return new SearchService(products, categories);
  });
}

// ── Shorthand getters ─────────────────────────────────────────────────────────
// These are ergonomic helpers so route handlers don't need to import TOKENS.

export function getProductService(): ProductService {
  bootstrapContainer();
  return container.resolve<ProductService>(TOKENS.ProductService);
}

export function getSearchService(): SearchService {
  bootstrapContainer();
  return container.resolve<SearchService>(TOKENS.SearchService);
}

export function getProductRepository(): PrismaProductRepository {
  bootstrapContainer();
  return container.resolve<PrismaProductRepository>(TOKENS.ProductRepository);
}

export function getCategoryRepository(): PrismaCategoryRepository {
  bootstrapContainer();
  return container.resolve<PrismaCategoryRepository>(TOKENS.CategoryRepository);
}

export function getReviewRepository(): PrismaReviewRepository {
  bootstrapContainer();
  return container.resolve<PrismaReviewRepository>(TOKENS.ReviewRepository);
}

export function getSellerRepository(): PrismaSellerRepository {
  bootstrapContainer();
  return container.resolve<PrismaSellerRepository>(TOKENS.SellerRepository);
}

/**
 * Service Registry — DI Container Setup
 */

import { container, TOKENS } from './container';
import { prisma } from '@/lib/db';
import { PrismaProductRepository } from '../repositories/product.repository';
import { PrismaCategoryRepository } from '../repositories/category.repository';
import { PrismaReviewRepository } from '../repositories/review.repository';
import { PrismaSellerRepository } from '../repositories/seller.repository';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { SearchService } from '../services/search.service';

let initialized = false;

export function bootstrapContainer(): void {
  if (initialized) return;
  initialized = true;

  container.register(TOKENS.ProductRepository, () => new PrismaProductRepository(prisma));
  container.register(TOKENS.CategoryRepository, () => new PrismaCategoryRepository(prisma));
  container.register(TOKENS.ReviewRepository, () => new PrismaReviewRepository(prisma));
  container.register(TOKENS.SellerRepository, () => new PrismaSellerRepository(prisma));

  container.register(TOKENS.ProductService, () => {
    const products = container.resolve<PrismaProductRepository>(TOKENS.ProductRepository);
    const categories = container.resolve<PrismaCategoryRepository>(TOKENS.CategoryRepository);
    const reviews = container.resolve<PrismaReviewRepository>(TOKENS.ReviewRepository);
    return new ProductService(products, categories, reviews);
  });

  container.register(TOKENS.CategoryService, () => {
    const categories = container.resolve<PrismaCategoryRepository>(TOKENS.CategoryRepository);
    return new CategoryService(categories);
  });

  container.register(TOKENS.SearchService, () => {
    const products = container.resolve<PrismaProductRepository>(TOKENS.ProductRepository);
    const categories = container.resolve<PrismaCategoryRepository>(TOKENS.CategoryRepository);
    return new SearchService(products, categories);
  });
}

export function getProductService(): ProductService { bootstrapContainer(); return container.resolve<ProductService>(TOKENS.ProductService); }
export function getCategoryService(): CategoryService { bootstrapContainer(); return container.resolve<CategoryService>(TOKENS.CategoryService); }
export function getSearchService(): SearchService { bootstrapContainer(); return container.resolve<SearchService>(TOKENS.SearchService); }
export function getProductRepository(): PrismaProductRepository { bootstrapContainer(); return container.resolve<PrismaProductRepository>(TOKENS.ProductRepository); }
export function getCategoryRepository(): PrismaCategoryRepository { bootstrapContainer(); return container.resolve<PrismaCategoryRepository>(TOKENS.CategoryRepository); }
export function getReviewRepository(): PrismaReviewRepository { bootstrapContainer(); return container.resolve<PrismaReviewRepository>(TOKENS.ReviewRepository); }
export function getSellerRepository(): PrismaSellerRepository { bootstrapContainer(); return container.resolve<PrismaSellerRepository>(TOKENS.SellerRepository); }

/** Service Registry — DI Container Setup */

import { container, TOKENS } from './container';
import { prisma } from '@/lib/db';
import { PrismaProductRepository } from '../repositories/product.repository';
import { PrismaCategoryRepository } from '../repositories/category.repository';
import { PrismaReviewRepository } from '../repositories/review.repository';
import { PrismaSellerRepository } from '../repositories/seller.repository';
import { ProductService } from '../services/product.service';
import { CategoryService } from '../services/category.service';
import { SellerService } from '../services/seller.service';
import { SearchService } from '../services/search.service';

let initialized = false;
export function bootstrapContainer(): void {
  if (initialized) return;
  initialized = true;
  container.register(TOKENS.ProductRepository, () => new PrismaProductRepository(prisma));
  container.register(TOKENS.CategoryRepository, () => new PrismaCategoryRepository(prisma));
  container.register(TOKENS.ReviewRepository, () => new PrismaReviewRepository(prisma));
  container.register(TOKENS.SellerRepository, () => new PrismaSellerRepository(prisma));
  container.register(TOKENS.ProductService, () => new ProductService(container.resolve<PrismaProductRepository>(TOKENS.ProductRepository), container.resolve<PrismaCategoryRepository>(TOKENS.CategoryRepository), container.resolve<PrismaReviewRepository>(TOKENS.ReviewRepository)));
  container.register(TOKENS.CategoryService, () => new CategoryService(container.resolve<PrismaCategoryRepository>(TOKENS.CategoryRepository)));
  container.register(TOKENS.SellerService, () => new SellerService(container.resolve<PrismaSellerRepository>(TOKENS.SellerRepository)));
  container.register(TOKENS.SearchService, () => new SearchService(container.resolve<PrismaProductRepository>(TOKENS.ProductRepository), container.resolve<PrismaCategoryRepository>(TOKENS.CategoryRepository)));
}
export function getProductService(): ProductService { bootstrapContainer(); return container.resolve<ProductService>(TOKENS.ProductService); }
export function getCategoryService(): CategoryService { bootstrapContainer(); return container.resolve<CategoryService>(TOKENS.CategoryService); }
export function getSellerService(): SellerService { bootstrapContainer(); return container.resolve<SellerService>(TOKENS.SellerService); }
export function getSearchService(): SearchService { bootstrapContainer(); return container.resolve<SearchService>(TOKENS.SearchService); }
export function getProductRepository(): PrismaProductRepository { bootstrapContainer(); return container.resolve<PrismaProductRepository>(TOKENS.ProductRepository); }
export function getCategoryRepository(): PrismaCategoryRepository { bootstrapContainer(); return container.resolve<PrismaCategoryRepository>(TOKENS.CategoryRepository); }
export function getReviewRepository(): PrismaReviewRepository { bootstrapContainer(); return container.resolve<PrismaReviewRepository>(TOKENS.ReviewRepository); }
export function getSellerRepository(): PrismaSellerRepository { bootstrapContainer(); return container.resolve<PrismaSellerRepository>(TOKENS.SellerRepository); }

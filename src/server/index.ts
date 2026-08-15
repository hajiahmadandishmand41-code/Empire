/**
 * Server-Side Module Barrel Export
 *
 * Public API surface of the server/ package.
 * Import from '@/server' for clean imports in route handlers.
 *
 * Example:
 *   import { getProductService, getSearchService, DomainError } from '@/server';
 */

// Infrastructure
export { container, TOKENS } from './infrastructure/container';
export type { ContainerToken } from './infrastructure/container';
export { bootstrapContainer, getProductService, getSearchService, getProductRepository, getCategoryRepository, getReviewRepository, getSellerRepository } from './infrastructure/registry';
export { DomainError, NotFoundError, ForbiddenError, UnauthorizedError, ConflictError, ValidationError, DatabaseUnavailableError, mapErrorToResponse } from './infrastructure/errors';

// Repository interfaces & types
export type { IProductRepository, ProductListFilter, CreateProductInput, UpdateProductInput, ProductRow, ProductDetailRow } from './repositories/product.repository';
export type { ICategoryRepository, CategoryRow, CreateCategoryInput, UpdateCategoryInput } from './repositories/category.repository';
export type { IReviewRepository, ReviewRow, RatingSummary, CreateReviewInput } from './repositories/review.repository';
export type { ISellerRepository, SellerPublicProfile, SellerRow, UpdateSellerStoreInput } from './repositories/seller.repository';
export type { PaginatedResult, BaseListFilter } from './repositories/base.repository';
export { toPaginated, safePage, safePageSize } from './repositories/base.repository';

// Services
export { ProductService, ProductServiceError } from './services/product.service';
export type { ProductListOptions, ProductListResult } from './services/product.service';
export { SearchService } from './services/search.service';
export type { SearchOptions, SearchResult, SuggestionResult } from './services/search.service';

// Algorithms
export { buildProductOrderBy, computeProductScore, rankProducts, DEFAULT_RANKING_CONFIG, RANKING_PRESETS } from './algorithms/product-ranking';
export type { RankingConfig, RankingSignalName, ScoredProduct } from './algorithms/product-ranking';
export { levenshtein, normalizeText, scoreField, computeSearchScore, generateSuggestions, buildSearchWhereClause } from './algorithms/search-scoring';
export type { SearchFieldWeights, MatchTypeScores, SearchableProduct, SearchSuggestion } from './algorithms/search-scoring';

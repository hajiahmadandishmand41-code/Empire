/**
 * Locale & direction types — exported from a single source.
 * Importing from `@/types` keeps `routing.ts` and components in sync.
 */
export type Locale = 'fa' | 'ps' | 'en';
export type Direction = 'rtl' | 'ltr';

/** Brand metadata, exposed for SEO / config. */
export interface BrandMeta {
  name: string;
  taglineKey: 'common.tagline';
  legalName: string;
  baseUrl: string;
}

/** Variant props shared between primitives. */
export type Size = 'sm' | 'md' | 'lg' | 'xl';
export type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive';

/**
 * Domain types (Phase 6) — the frontend contract for a future backend.
 * All API/mock layers produce objects that satisfy these shapes.
 */
export type {
  Product,
  ProductSummary,
  ProductImage,
  ProductBadge,
  CategoryKey,
  CurrencyCode,
} from './product';
export type { Category } from './category';
export type { CartLineBase, CartSummary } from './cart';
export type {
  Order,
  OrderDraft,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ShippingAddress,
  Transaction,
  ShippingMethod,
  ShippingKind,
} from './order';
export type { User, UserRole, AuthSession } from './user';
export type { ApiResponse, ApiSuccess, ApiFailure, Paginated, ProductListQuery } from './api';
export type { Review, ReviewAuthor, ProductRatingSummary, WishlistEntry } from './review';

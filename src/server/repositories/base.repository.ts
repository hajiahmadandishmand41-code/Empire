/**
 * Base Repository Interfaces and Types
 *
 * Defines the core contracts for all repositories in the system.
 * Following the Repository Pattern from Clean Architecture:
 *   - Repositories abstract the data source from the domain.
 *   - Callers depend only on the interface, never on Prisma directly.
 *   - Swapping the database or adding caching requires no changes to services.
 */

/** Standard paginated result container. */
export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

/** Common list filter arguments used across many repositories. */
export interface BaseListFilter {
  page?: number;
  pageSize?: number;
  q?: string;
}

/** Produces a PaginatedResult from raw items + counts. */
export function toPaginated<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResult<T> {
  const skip = (page - 1) * pageSize;
  return {
    items,
    total,
    page,
    pageSize,
    hasMore: skip + items.length < total,
  };
}

/** Safe integer clamping helpers used in repositories. */
export function safePage(raw: unknown, defaultVal = 1): number {
  const n = parseInt(String(raw ?? defaultVal), 10);
  return Math.max(1, isNaN(n) ? defaultVal : n);
}

export function safePageSize(raw: unknown, max = 100, defaultVal = 20): number {
  const n = parseInt(String(raw ?? defaultVal), 10);
  return Math.min(max, Math.max(1, isNaN(n) ? defaultVal : n));
}

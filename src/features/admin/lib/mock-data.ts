/**
 * Legacy type-only compatibility barrel.
 *
 * This module intentionally exports no runtime values and contains no mock or
 * fixture data. Production data must come from repositories/services.
 * New code should import these contracts from ./types directly.
 */
export type {
  AdminStats,
  AdminOrderRow,
  AdminUserRow,
  AdminProductRow,
  AdminCategoryRow,
  SalesByDay,
  TopProduct,
  SellerStatus,
  AdminSellerRow,
  AdminTransactionRow,
  AdminRevenueSummary,
} from './types';

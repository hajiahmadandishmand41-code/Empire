/**
 * Admin mock data — Phase 10.
 */
import { shopProducts } from '@/features/shop/data/products';

export interface AdminStats { users: number; products: number; orders: number; categories: number; revenue: number; currency: string; }
export interface AdminOrderRow { id: string; reference: string; status: string; paymentMethod: string; total: number; currency: string; itemCount: number; customerName: string; createdAt: string; }
export interface AdminUserRow { id: string; fullName: string; email: string | null; phone: string | null; role: 'customer' | 'seller' | 'admin'; isActive: boolean; createdAt: string; orderCount: number; }
export interface AdminProductRow { id: string; slug: string; name: string; price: number; currency: string; categoryName: string; region: string; inStock: boolean; isHero?: boolean; createdAt: string; }
export interface AdminCategoryRow { id: string; key: string; name: string; slug: string; productCount: number; }
export interface SalesByDay { date: string; count: number; revenue: number; }
export interface TopProduct { slug: string; name: string; units: number; revenue: number; }
const NOW = Date.now();
export const mockStats: AdminStats = { users: 128, products: shopProducts.length, orders: 47, categories: 10, revenue: 284500, currency: 'AFN' };
export const mockProducts: AdminProductRow[] = shopProducts.map((p, index) => ({ id: p.id ?? `mock-product-${index}`, slug: p.slug, name: p.name, price: p.price, currency: 'AFN', categoryName: p.categoryKey, region: p.region ?? 'افغانستان', inStock: p.inStock ?? true, isHero: false, createdAt: new Date(NOW - index * 86400000).toISOString() }));
export const mockCategories: AdminCategoryRow[] = [];
export const mockOrders: AdminOrderRow[] = [];
export const mockUsers: AdminUserRow[] = [];
export function mockSalesByDay(days: number): SalesByDay[] { return Array.from({ length: days }, (_, i) => ({ date: new Date(NOW - (days - i - 1) * 86400000).toISOString().slice(0, 10), count: 0, revenue: 0 })); }
export function mockTopProducts(limit = 5): TopProduct[] { return mockProducts.slice(0, limit).map((p) => ({ slug: p.slug, name: p.name, units: 0, revenue: 0 })); }
export const mockSellers = [] as any[];
export const mockTransactions = [] as any[];
export function mockRevenueSummary(days: number) { return { gross: 0, paid: 0, pending: 0, refunded: 0, currency: 'AFN', orderCount: 0, paidOrderCount: 0, averageOrderValue: 0, byDay: mockSalesByDay(days), byMethod: [], }; }
export interface AdminRevenueSummary { gross: number; paid: number; pending: number; refunded: number; currency: string; orderCount: number; paidOrderCount: number; averageOrderValue: number; byDay: SalesByDay[]; byMethod: Array<{ method: string; amount: number; count: number }>; }
export type AdminSellerRow = any;
export type AdminTransactionRow = any;
export type SellerStatus = 'none' | 'pending' | 'approved' | 'rejected';

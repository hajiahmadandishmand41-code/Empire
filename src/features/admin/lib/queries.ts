import { Prisma, OrderStatus, PaymentMethod, PaymentStatus, Role, SellerStatus } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { mockStats, mockProducts, mockCategories, mockOrders, mockUsers, mockSalesByDay, mockTopProducts, mockSellers, mockTransactions, mockRevenueSummary, type AdminStats, type AdminOrderRow, type AdminUserRow, type AdminProductRow, type AdminCategoryRow, type SalesByDay, type TopProduct, type AdminSellerRow, type AdminTransactionRow, type AdminRevenueSummary } from './mock-data';

const isDev = process.env.NODE_ENV !== 'production';
export interface ListFilters { q?: string; page?: number; pageSize?: number; }
export interface OrderFilters extends ListFilters { status?: string; }
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; source: 'db' | 'mock'; }
export interface SellerFilters extends ListFilters { status?: SellerStatus | 'all'; }
export interface TransactionFilters extends ListFilters { status?: string; method?: string; }

function paginate<T>(items: T[], page = 1, pageSize = 10, source: 'db' | 'mock' = 'mock'): Paged<T> { const total = items.length; const start = (page - 1) * pageSize; return { items: items.slice(start, start + pageSize), total, page, pageSize, source }; }
function enumValue<T extends string>(values: readonly T[], value: string | undefined): T | undefined { return value && values.some((candidate) => candidate === value) ? values.find((candidate) => candidate === value) : undefined; }
const ORDER_STATUSES = Object.values(OrderStatus) as readonly OrderStatus[];
const PAYMENT_METHODS = Object.values(PaymentMethod) as readonly PaymentMethod[];
const PAYMENT_STATUSES = Object.values(PaymentStatus) as readonly PaymentStatus[];

export async function getAdminStats(): Promise<AdminStats & { source: 'db' | 'mock' }> {
  if (!isDatabaseConfigured()) { if (!isDev) throw new Error('Database not configured'); return { ...mockStats, source: 'mock' }; }
  try { const [users, products, orders, categories, agg] = await Promise.all([prisma.user.count(), prisma.product.count(), prisma.order.count(), prisma.category.count(), prisma.order.aggregate({ _sum: { total: true } })]); if (isDev && users === 0 && products === 0 && orders === 0 && categories === 0) return { ...mockStats, source: 'mock' }; return { users, products, orders, categories, revenue: agg._sum.total?.toNumber() ?? 0, currency: 'AFN', source: 'db' }; }
  catch (err) { console.error('[admin/stats] DB error:', err); if (isDev) return { ...mockStats, source: 'mock' }; throw err; }
}

export async function listAdminProducts(f: ListFilters = {}): Promise<Paged<AdminProductRow>> {
  const page = f.page ?? 1; const pageSize = f.pageSize ?? 10; const q = f.q?.trim().toLowerCase() ?? '';
  if (!isDatabaseConfigured()) { if (!isDev) throw new Error('Database not configured'); return paginate(q ? mockProducts.filter((p) => p.name.toLowerCase().includes(q)) : mockProducts, page, pageSize); }
  try { const where: Prisma.ProductWhereInput = q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { slug: { contains: q, mode: 'insensitive' } }, { region: { contains: q, mode: 'insensitive' } }] } : {}; const [rows, total] = await Promise.all([prisma.product.findMany({ where, include: { category: true }, orderBy: { createdAt: 'desc' }, take: pageSize, skip: (page - 1) * pageSize }), prisma.product.count({ where })]); if (isDev && total === 0 && !q) return paginate(mockProducts, page, pageSize); return { items: rows.map((p) => ({ id: p.id, slug: p.slug, name: p.name, price: p.price.toNumber(), currency: p.currency, categoryName: p.category.name, region: p.region, inStock: p.inStock, isHero: p.badge === 'hero', createdAt: p.createdAt.toISOString() })), total, page, pageSize, source: 'db' }; }
  catch (err) { console.error('[admin/products] DB error:', err); if (isDev) return paginate(mockProducts, page, pageSize); throw err; }
}

export async function listAdminCategories(): Promise<{ items: AdminCategoryRow[]; source: 'db' | 'mock' }> {
  if (!isDatabaseConfigured()) { if (!isDev) throw new Error('Database not configured'); return { items: mockCategories, source: 'mock' }; }
  try { const rows = await prisma.category.findMany({ include: { _count: { select: { products: true } } }, orderBy: { name: 'asc' } }); if (isDev && rows.length === 0) return { items: mockCategories, source: 'mock' }; return { items: rows.map((c) => ({ id: c.id, key: c.key, name: c.name, slug: c.slug, productCount: c._count.products })), source: 'db' }; }
  catch (err) { console.error('[admin/categories] DB error:', err); if (isDev) return { items: mockCategories, source: 'mock' }; throw err; }
}

export async function listAdminOrders(f: OrderFilters = {}): Promise<Paged<AdminOrderRow>> {
  const page = f.page ?? 1; const pageSize = f.pageSize ?? 10; const q = f.q?.trim() ?? ''; const status = enumValue(ORDER_STATUSES, f.status);
  if (!isDatabaseConfigured()) { if (!isDev) throw new Error('Database not configured'); let items = mockOrders; if (status) items = items.filter((o) => o.status === status); if (q) items = items.filter((o) => o.reference.includes(q) || o.customerName.toLowerCase().includes(q.toLowerCase())); return paginate(items, page, pageSize); }
  try { const where: Prisma.OrderWhereInput = { ...(status ? { status } : {}), ...(q ? { OR: [{ reference: { contains: q, mode: 'insensitive' } }, { address: { fullName: { contains: q, mode: 'insensitive' } } }] } : {}) }; const [rows, total] = await Promise.all([prisma.order.findMany({ where, include: { address: true }, orderBy: { createdAt: 'desc' }, take: pageSize, skip: (page - 1) * pageSize }), prisma.order.count({ where })]); if (isDev && total === 0 && !q && !status) return paginate(mockOrders, page, pageSize); return { items: rows.map((o) => ({ id: o.id, reference: o.reference, status: o.status, paymentMethod: o.paymentMethod, total: o.total.toNumber(), currency: o.currency, itemCount: o.itemCount, customerName: o.address.fullName, createdAt: o.createdAt.toISOString() })), total, page, pageSize, source: 'db' }; }
  catch (err) { console.error('[admin/orders] DB error:', err); if (isDev) return paginate(mockOrders, page, pageSize); throw err; }
}

export async function listAdminUsers(f: ListFilters = {}): Promise<Paged<AdminUserRow>> {
  const page = f.page ?? 1; const pageSize = f.pageSize ?? 10; const q = f.q?.trim().toLowerCase() ?? '';
  if (!isDatabaseConfigured()) { if (!isDev) throw new Error('Database not configured'); return paginate(q ? mockUsers.filter((u) => u.fullName.toLowerCase().includes(q) || (u.email ?? '').toLowerCase().includes(q) || (u.phone ?? '').includes(q)) : mockUsers, page, pageSize); }
  try { const where: Prisma.UserWhereInput = q ? { OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { phone: { contains: q } }] } : {}; const [rows, total] = await Promise.all([prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: pageSize, skip: (page - 1) * pageSize, include: { _count: { select: { orders: true } } } }), prisma.user.count({ where })]); if (isDev && total === 0 && !q) return paginate(mockUsers, page, pageSize); return { items: rows.map((u) => ({ id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, role: u.role, isActive: u.isActive, createdAt: u.createdAt.toISOString(), orderCount: u._count.orders })), total, page, pageSize, source: 'db' }; }
  catch (err) { console.error('[admin/users] DB error:', err); if (isDev) return paginate(mockUsers, page, pageSize); throw err; }
}

export async function getSalesByDay(days = 14): Promise<{ items: SalesByDay[]; source: 'db' | 'mock' }> {
  if (!isDatabaseConfigured()) { if (!isDev) throw new Error('Database not configured'); return { items: mockSalesByDay(days), source: 'mock' }; }
  try { const since = new Date(Date.now() - days * 86400000); const rows = await prisma.order.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, total: true } }); if (isDev && rows.length === 0) return { items: mockSalesByDay(days), source: 'mock' }; const buckets = new Map<string, { count: number; revenue: number }>(); for (let i = 0; i < days; i++) { const d = new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10); buckets.set(d, { count: 0, revenue: 0 }); } for (const r of rows) { const b = buckets.get(r.createdAt.toISOString().slice(0, 10)); if (b) { b.count += 1; b.revenue += r.total.toNumber(); } } return { items: Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v })), source: 'db' }; }
  catch (err) { console.error('[admin/sales-by-day] DB error:', err); if (isDev) return { items: mockSalesByDay(days), source: 'mock' }; throw err; }
}

export async function getTopProducts(limit = 5): Promise<{ items: TopProduct[]; source: 'db' | 'mock' }> {
  if (!isDatabaseConfigured()) { if (!isDev) throw new Error('Database not configured'); return { items: mockTopProducts(limit), source: 'mock' }; }
  try { const grouped = await prisma.orderItem.groupBy({ by: ['slug', 'name'], _sum: { quantity: true, price: true }, orderBy: { _sum: { quantity: 'desc' } }, take: limit }); if (isDev && grouped.length === 0) return { items: mockTopProducts(limit), source: 'mock' }; return { items: grouped.map((g) => ({ slug: g.slug, name: g.name, units: g._sum.quantity ?? 0, revenue: g._sum.price?.toNumber() ?? 0 })), source: 'db' }; }
  catch (err) { console.error('[admin/top-products] DB error:', err); if (isDev) return { items: mockTopProducts(limit), source: 'mock' }; throw err; }
}

export async function listAdminSellers(f: SellerFilters = {}): Promise<Paged<AdminSellerRow>> {
  const page = f.page ?? 1; const pageSize = f.pageSize ?? 10; const q = f.q?.trim().toLowerCase() ?? ''; const status = f.status && f.status !== 'all' ? f.status : undefined;
  if (!isDatabaseConfigured()) { if (!isDev) throw new Error('Database not configured'); let items = mockSellers; if (status) items = items.filter((s) => s.sellerStatus === status); if (q) items = items.filter((s) => s.fullName.toLowerCase().includes(q) || (s.email ?? '').toLowerCase().includes(q) || (s.shopName ?? '').toLowerCase().includes(q)); return paginate(items, page, pageSize); }
  try { const where: Prisma.UserWhereInput = { OR: [{ role: Role.seller }, { sellerStatus: { not: SellerStatus.none } }], ...(status ? { sellerStatus: status } : {}), ...(q ? { AND: [{ OR: [{ fullName: { contains: q, mode: 'insensitive' } }, { email: { contains: q, mode: 'insensitive' } }, { sellerShopName: { contains: q, mode: 'insensitive' } }] }] } : {}) }; const [rows, total] = await Promise.all([prisma.user.findMany({ where, orderBy: { createdAt: 'desc' }, take: pageSize, skip: (page - 1) * pageSize, include: { _count: { select: { products: true } } } }), prisma.user.count({ where })]); if (isDev && total === 0 && !q && !status) return paginate(mockSellers, page, pageSize); return { items: rows.map((u) => ({ id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, shopName: u.sellerShopName, bio: u.sellerBio, sellerStatus: u.sellerStatus, isActive: u.isActive, productCount: u._count.products, createdAt: u.createdAt.toISOString() })), total, page, pageSize, source: 'db' }; }
  catch (err) { console.error('[admin/sellers] DB error:', err); if (isDev) return paginate(mockSellers, page, pageSize); throw err; }
}

export async function getAdminSeller(id: string): Promise<AdminSellerRow | null> {
  if (!isDatabaseConfigured()) { if (!isDev) throw new Error('Database not configured'); return mockSellers.find((s) => s.id === id) ?? null; }
  try { const u = await prisma.user.findUnique({ where: { id }, include: { _count: { select: { products: true } } } }); if (!u) return null; return { id: u.id, fullName: u.fullName, email: u.email, phone: u.phone, shopName: u.sellerShopName, bio: u.sellerBio, sellerStatus: u.sellerStatus, isActive: u.isActive, productCount: u._count.products, createdAt: u.createdAt.toISOString() }; }
  catch (err) { console.error('[admin/seller] DB error:', err); if (isDev) return mockSellers.find((s) => s.id === id) ?? null; throw err; }
}

export async function listAdminTransactions(f: TransactionFilters = {}): Promise<Paged<AdminTransactionRow>> {
  const page = f.page ?? 1; const pageSize = f.pageSize ?? 10; const q = f.q?.trim() ?? ''; const status = enumValue(PAYMENT_STATUSES, f.status); const method = enumValue(PAYMENT_METHODS, f.method);
  if (!isDatabaseConfigured()) { if (!isDev) throw new Error('Database not configured'); let items = mockTransactions; if (status) items = items.filter((t) => t.status === status); if (method) items = items.filter((t) => t.method === method); if (q) items = items.filter((t) => t.reference.toLowerCase().includes(q.toLowerCase()) || t.orderReference.toLowerCase().includes(q.toLowerCase())); return paginate(items, page, pageSize); }
  try { const where: Prisma.TransactionWhereInput = { ...(status ? { status } : {}), ...(method ? { method } : {}), ...(q ? { OR: [{ reference: { contains: q, mode: 'insensitive' } }, { order: { reference: { contains: q, mode: 'insensitive' } } }] } : {}) }; const [rows, total] = await Promise.all([prisma.transaction.findMany({ where, include: { order: { select: { reference: true } } }, orderBy: { createdAt: 'desc' }, take: pageSize, skip: (page - 1) * pageSize }), prisma.transaction.count({ where })]); if (isDev && total === 0 && !q && !status && !method) return paginate(mockTransactions, page, pageSize); return { items: rows.map((t) => ({ id: t.id, reference: t.reference, orderId: t.orderId, orderReference: t.order.reference, provider: t.provider, method: t.method, status: t.status, amount: t.amount.toNumber(), currency: t.currency, paidAt: t.paidAt?.toISOString() ?? null, createdAt: t.createdAt.toISOString() })), total, page, pageSize, source: 'db' }; }
  catch (err) { console.error('[admin/transactions] DB error:', err); if (isDev) return paginate(mockTransactions, page, pageSize); throw err; }
}

export async function getAdminRevenue(days = 30): Promise<AdminRevenueSummary & { source: 'db' | 'mock' }> {
  if (!isDatabaseConfigured()) { if (!isDev) throw new Error('Database not configured'); return { ...mockRevenueSummary(days), source: 'mock' }; }
  try {
    const since = new Date(Date.now() - days * 86400000);
    const [orders, txns] = await Promise.all([prisma.order.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, total: true, paymentStatus: true, paymentMethod: true } }), prisma.transaction.findMany({ where: { createdAt: { gte: since } }, select: { amount: true, status: true, method: true } })]);
    if (isDev && orders.length === 0 && txns.length === 0) return { ...mockRevenueSummary(days), source: 'mock' };
    const gross = orders.reduce((s, o) => s + o.total.toNumber(), 0);
    const paid = orders.filter((o) => o.paymentStatus === PaymentStatus.paid).reduce((s, o) => s + o.total.toNumber(), 0);
    const pending = orders.filter((o) => o.paymentStatus === PaymentStatus.pending).reduce((s, o) => s + o.total.toNumber(), 0);
    const refunded = txns.filter((t) => t.status === PaymentStatus.refunded).reduce((s, t) => s + t.amount.toNumber(), 0);
    const paidOrderCount = orders.filter((o) => o.paymentStatus === PaymentStatus.paid).length;
    const buckets = new Map<string, { count: number; revenue: number }>();
    for (let i = 0; i < days; i++) { const d = new Date(Date.now() - (days - 1 - i) * 86400000).toISOString().slice(0, 10); buckets.set(d, { count: 0, revenue: 0 }); }
    for (const o of orders) { const b = buckets.get(o.createdAt.toISOString().slice(0, 10)); if (b) { b.count += 1; b.revenue += o.total.toNumber(); } }
    const methodMap = new Map<string, { amount: number; count: number }>();
    for (const t of txns.filter((x) => x.status === PaymentStatus.paid)) { const m = methodMap.get(t.method) ?? { amount: 0, count: 0 }; m.amount += t.amount.toNumber(); m.count += 1; methodMap.set(t.method, m); }
    return { gross, paid, pending, refunded, currency: 'AFN', orderCount: orders.length, paidOrderCount, averageOrderValue: paidOrderCount ? Math.round(paid / paidOrderCount) : 0, byDay: Array.from(buckets.entries()).map(([date, v]) => ({ date, ...v })), byMethod: Array.from(methodMap.entries()).map(([method, v]) => ({ method, ...v })), source: 'db' };
  } catch (err) { console.error('[admin/revenue] DB error:', err); if (isDev) return { ...mockRevenueSummary(days), source: 'mock' }; throw err; }
}

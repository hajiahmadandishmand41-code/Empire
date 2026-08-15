/** Orders queries — server-only customer/seller order reads. */
import { prisma, isDatabaseConfigured } from '@/lib/db';
import { mapOrder } from '@/lib/db-mappers';
import type { Order, OrderStatus } from '@/types';

const STATUSES: OrderStatus[] = ['pending','confirmed','processing','shipped','delivered','cancelled'];
function normStatus(s?: string | null): OrderStatus | undefined { if (!s) return undefined; return (STATUSES as string[]).includes(s) ? (s as OrderStatus) : undefined; }

export interface OrderListItem { id: string; reference: string; status: OrderStatus; paymentStatus: string; paymentMethod: string; itemCount: number; total: number; currency: string; createdAt: string; }
export interface Paged<T> { items: T[]; total: number; page: number; pageSize: number; source: 'db' | 'empty'; }
interface UserListArgs { userId: string; page?: number; pageSize?: number; status?: string; }

export async function listUserOrders(args: UserListArgs): Promise<Paged<OrderListItem>> {
  const page = Math.max(1, args.page ?? 1); const pageSize = Math.min(50, Math.max(5, args.pageSize ?? 10)); const status = normStatus(args.status);
  if (!isDatabaseConfigured()) return { items: [], total: 0, page, pageSize, source: 'empty' };
  const where = { userId: args.userId, ...(status ? { status } : {}) };
  const [rows, total] = await Promise.all([prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }), prisma.order.count({ where })]);
  return { items: rows.map((r) => ({ id: r.id, reference: r.reference, status: r.status as OrderStatus, paymentStatus: r.paymentStatus, paymentMethod: r.paymentMethod, itemCount: r.itemCount, total: Number(r.total), currency: r.currency, createdAt: r.createdAt.toISOString() })), total, page, pageSize, source: 'db' };
}

interface SellerListArgs { sellerId: string; page?: number; pageSize?: number; status?: string; q?: string; }
export async function listSellerOrders(args: SellerListArgs): Promise<Paged<OrderListItem>> {
  const page = Math.max(1, args.page ?? 1); const pageSize = Math.min(50, Math.max(5, args.pageSize ?? 10)); const status = normStatus(args.status); const q = args.q?.trim();
  if (!isDatabaseConfigured()) return { items: [], total: 0, page, pageSize, source: 'empty' };
  const where = { items: { some: { product: { sellerId: args.sellerId } } }, ...(status ? { status } : {}), ...(q ? { OR: [{ reference: { contains: q, mode: 'insensitive' as const } }, { address: { fullName: { contains: q, mode: 'insensitive' as const } } }] } : {}) };
  const [rows, total] = await Promise.all([prisma.order.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }), prisma.order.count({ where })]);
  return { items: rows.map((r) => ({ id: r.id, reference: r.reference, status: r.status as OrderStatus, paymentStatus: r.paymentStatus, paymentMethod: r.paymentMethod, itemCount: r.itemCount, total: Number(r.total), currency: r.currency, createdAt: r.createdAt.toISOString() })), total, page, pageSize, source: 'db' };
}

export async function getOrderForViewer(ref: string, viewer: { id: string; role: 'customer' | 'seller' | 'admin' } | null): Promise<{ order: Order; totals: { subtotal: number; shipping: number; total: number } } | null> {
  if (!isDatabaseConfigured()) return null;
  const row = await prisma.order.findFirst({ where: { OR: [{ id: ref }, { reference: ref }] }, include: { items: { include: { product: true } }, address: true, shippingMethod: true } });
  if (!row) return null;
  const isOwner = viewer && row.userId && row.userId === viewer.id;
  const isAdmin = viewer?.role === 'admin';
  const isSeller = viewer?.role === 'seller' && row.items.some((i) => i.product?.sellerId && i.product.sellerId === viewer.id);
  const isGuestReceipt = !row.userId && !viewer;
  if (!isOwner && !isAdmin && !isSeller && !isGuestReceipt) return null;
  return { order: mapOrder(row), totals: { subtotal: Number(row.subtotal), shipping: Number(row.shipping), total: Number(row.total) } };
}

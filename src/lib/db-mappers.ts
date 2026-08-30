/** Prisma -> domain type mappers. */
import type {
  Category as PCategory,
  Order as POrder,
  OrderItem as POrderItem,
  Address as PAddress,
  Product as PProduct,
  Transaction as PTransaction,
  ShippingMethod as PShippingMethod,
} from '@prisma/client';
import type {
  Category,
  CategoryKey,
  CurrencyCode,
  Order,
  Product,
  ProductImage,
  ProductSummary,
  ShippingAddress,
  ShippingKind,
  ShippingMethod,
  Transaction,
} from '@/types';

type ProductWithCategory = PProduct & { category: PCategory };

function parseJson<T>(raw: unknown, fallback: T): T {
  if (raw == null) return fallback;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw) as T; } catch { return fallback; }
  }
  return raw as T;
}

const moneyNumber = (value: unknown): number => Number(value ?? 0);

type ProductWithCategoryAndSeller = ProductWithCategory & {
  seller?: { id: string; fullName: string; sellerShopName: string | null } | null;
};

export function mapProductSummary(
  p: ProductWithCategoryAndSeller,
  extras: { averageRating?: number; reviewCount?: number } = {},
): ProductSummary {
  const images = parseJson<ProductImage[]>(p.imagesJson, [{ src: null, alt: p.name }]);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    shortDescription: p.shortDescription,
    categoryKey: p.category.key as CategoryKey,
    price: moneyNumber(p.price),
    currency: (p.currency as CurrencyCode) ?? 'USD',
    badge: (p.badge as ProductSummary['badge']) ?? undefined,
    region: p.region,
    images,
    inStock: p.inStock,
    sellerId: p.sellerId ?? null,
    sellerName: p.seller?.fullName ?? null,
    sellerShopName: p.seller?.sellerShopName ?? null,
    salesCount: (p as unknown as { salesCount?: number }).salesCount ?? 0,
    viewCount: (p as unknown as { viewCount?: number }).viewCount ?? 0,
    sellerWhatsapp: (p as unknown as { whatsappNumber?: string | null }).whatsappNumber ?? null,
    comparePrice: p.compareAtPrice == null ? null : moneyNumber(p.compareAtPrice),
    videoUrl: (p as unknown as { videoUrl?: string | null }).videoUrl ?? null,
    isTraditional: (p as unknown as { isTraditional?: boolean }).isTraditional ?? false,
    averageRating: extras.averageRating,
    reviewCount: extras.reviewCount,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function mapProduct(
  p: ProductWithCategoryAndSeller,
  extras: { averageRating?: number; reviewCount?: number } = {},
): Product {
  return {
    ...mapProductSummary(p, extras),
    description: p.description ? p.description.split('\n\n') : undefined,
    features: parseJson<string[]>(p.featuresJson, []),
  };
}

export function mapCategory(c: PCategory & { _count?: { products: number } }): Category {
  return { key: c.key as CategoryKey, name: c.name, slug: c.slug, productCount: c._count?.products };
}

export function mapAddress(a: PAddress): ShippingAddress {
  return { id: a.id, label: a.label ?? undefined, fullName: a.fullName, phone: a.phone, province: a.province, district: a.district, city: a.city ?? undefined, addressLine: a.addressLine, postalCode: a.postalCode ?? undefined, notes: a.notes ?? undefined, isDefault: a.isDefault ?? false };
}

export function mapShippingMethod(m: PShippingMethod): ShippingMethod {
  return { id: m.id, key: m.key, name: m.name, description: m.description ?? undefined, kind: m.kind as ShippingKind, cost: moneyNumber(m.cost), currency: m.currency, etaDays: m.etaDays ?? undefined, isActive: m.isActive, sortOrder: m.sortOrder };
}

export function mapOrder(o: POrder & { items: POrderItem[]; address: PAddress; shippingMethod?: PShippingMethod | null }): Order {
  return {
    id: o.id, reference: o.reference, status: o.status, paymentMethod: o.paymentMethod, paymentStatus: o.paymentStatus,
    createdAt: o.createdAt.toISOString(), updatedAt: o.updatedAt.toISOString(),
    items: o.items.map((i) => ({ slug: i.slug, name: i.name, price: moneyNumber(i.price), quantity: i.quantity })),
    address: { ...mapAddress(o.address), ...(o.shippingFullName ? { fullName: o.shippingFullName } : {}), ...(o.shippingPhone ? { phone: o.shippingPhone } : {}), ...(o.shippingProvince ? { province: o.shippingProvince } : {}), ...(o.shippingDistrict ? { district: o.shippingDistrict } : {}), ...(o.shippingCity !== null && o.shippingCity !== undefined ? { city: o.shippingCity ?? undefined } : {}), ...(o.shippingAddressLine ? { addressLine: o.shippingAddressLine } : {}), ...(o.shippingPostalCode !== null && o.shippingPostalCode !== undefined ? { postalCode: o.shippingPostalCode ?? undefined } : {}), ...(o.shippingNotes !== null && o.shippingNotes !== undefined ? { notes: o.shippingNotes ?? undefined } : {}) },
    shippingCost: moneyNumber(o.shipping), shippingMethod: o.shippingMethod ? mapShippingMethod(o.shippingMethod) : null, shippingMethodId: o.shippingMethodId ?? undefined,
    summary: { itemCount: o.itemCount, subtotal: moneyNumber(o.subtotal), currency: (o.currency as CurrencyCode) ?? 'USD' },
  };
}

export function mapTransaction(t: PTransaction): Transaction {
  return { id: t.id, orderId: t.orderId, reference: t.reference, provider: t.provider, method: t.method, status: t.status, amount: moneyNumber(t.amount), currency: t.currency, providerTxnId: t.providerTxnId ?? undefined, failureReason: t.failureReason ?? undefined, paidAt: t.paidAt ? t.paidAt.toISOString() : undefined, createdAt: t.createdAt.toISOString(), updatedAt: t.updatedAt.toISOString() };
}

/**
 * Seller Repository
 *
 * Abstracts all database access for Seller-specific User data.
 * Sellers are Users with role='seller'. This repository handles
 * seller profile, store settings, and public listing queries.
 */

import type { PrismaClient } from '@prisma/client';
import type { PaginatedResult, BaseListFilter } from './base.repository';
import { toPaginated } from './base.repository';

export interface SellerPublicProfile {
  id: string;
  shopName: string | null;
  bio: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  whatsapp: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  productCount: number;
}

export interface PublicSellerListItem {
  id: string;
  shopName: string;
  bio: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  city: string | null;
  country: string | null;
  productCount: number;
}

export interface PublicSellerListFilter extends BaseListFilter {
  city?: string;
  sort?: 'popular' | 'newest' | 'name';
}

export interface SellerRow {
  id: string;
  shopName: string | null;
  email: string | null;
  phone: string | null;
  status: string;
  commissionRate: number;
  createdAt: Date;
  productCount?: number;
  orderCount?: number;
}

export interface UpdateSellerStoreInput {
  sellerShopName?: string;
  sellerBio?: string;
  sellerLogoUrl?: string;
  sellerBannerUrl?: string;
  sellerWhatsapp?: string;
  sellerContactEmail?: string;
  sellerContactPhone?: string;
  sellerAddress?: string;
  sellerCity?: string;
  sellerCountry?: string;
}

export interface ISellerRepository {
  findPublicProfile(sellerId: string): Promise<SellerPublicProfile | null>;
  findPublicMany(filter: PublicSellerListFilter): Promise<PaginatedResult<PublicSellerListItem>>;
  findMany(filter: BaseListFilter): Promise<PaginatedResult<SellerRow>>;
  findById(id: string): Promise<SellerRow | null>;
  updateStoreSettings(sellerId: string, input: UpdateSellerStoreInput): Promise<void>;
  getStoreSettings(sellerId: string): Promise<UpdateSellerStoreInput | null>;
}

export class PrismaSellerRepository implements ISellerRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findPublicProfile(sellerId: string): Promise<SellerPublicProfile | null> {
    const user = await this.prisma.user.findUnique({
      where: { id: sellerId, role: 'seller', sellerStatus: 'approved', isActive: true },
      select: {
        id: true,
        sellerShopName: true,
        sellerBio: true,
        sellerLogoUrl: true,
        sellerBannerUrl: true,
        sellerWhatsapp: true,
        sellerContactEmail: true,
        sellerContactPhone: true,
        sellerAddress: true,
        sellerCity: true,
        sellerCountry: true,
        _count: { select: { products: true } },
      },
    });
    if (!user) return null;
    return {
      id: user.id,
      shopName: user.sellerShopName,
      bio: user.sellerBio,
      logoUrl: user.sellerLogoUrl,
      bannerUrl: user.sellerBannerUrl,
      whatsapp: user.sellerWhatsapp,
      contactEmail: user.sellerContactEmail,
      contactPhone: user.sellerContactPhone,
      address: user.sellerAddress,
      city: user.sellerCity,
      country: user.sellerCountry,
      productCount: user._count.products,
    };
  }

  async findPublicMany(filter: PublicSellerListFilter): Promise<PaginatedResult<PublicSellerListItem>> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(48, Math.max(1, filter.pageSize ?? 24));
    const skip = (page - 1) * pageSize;
    const q = filter.q?.trim();
    const city = filter.city?.trim();
    const where = {
      role: 'seller' as const,
      sellerStatus: 'approved' as const,
      isActive: true,
      sellerShopName: { not: null as string | null },
      ...(city ? { sellerCity: { contains: city, mode: 'insensitive' as const } } : {}),
      ...(q
        ? { OR: [
            { sellerShopName: { contains: q, mode: 'insensitive' as const } },
            { sellerBio: { contains: q, mode: 'insensitive' as const } },
            { sellerCity: { contains: q, mode: 'insensitive' as const } },
          ] }
        : {}),
    };
    const orderBy = filter.sort === 'name'
      ? [{ sellerShopName: 'asc' as const }, { createdAt: 'desc' as const }]
      : filter.sort === 'newest'
        ? [{ createdAt: 'desc' as const }]
        : [{ products: { _count: 'desc' as const } }, { createdAt: 'desc' as const }];

    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          sellerShopName: true,
          sellerBio: true,
          sellerLogoUrl: true,
          sellerBannerUrl: true,
          sellerCity: true,
          sellerCountry: true,
          _count: { select: { products: true } },
        },
        orderBy,
        take: pageSize,
        skip,
      }),
      this.prisma.user.count({ where }),
    ]);

    return toPaginated(rows.map((row) => ({
      id: row.id,
      shopName: row.sellerShopName ?? 'Eshop Seller',
      bio: row.sellerBio,
      logoUrl: row.sellerLogoUrl,
      bannerUrl: row.sellerBannerUrl,
      city: row.sellerCity,
      country: row.sellerCountry,
      productCount: row._count.products,
    })), total, page, pageSize);
  }

  async findMany(filter: BaseListFilter): Promise<PaginatedResult<SellerRow>> {
    const page = Math.max(1, filter.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, filter.pageSize ?? 20));
    const skip = (page - 1) * pageSize;
    const where = {
      role: 'seller' as const,
      ...(filter.q ? { OR: [
        { sellerShopName: { contains: filter.q, mode: 'insensitive' as const } },
        { email: { contains: filter.q, mode: 'insensitive' as const } },
        { fullName: { contains: filter.q, mode: 'insensitive' as const } },
      ] } : {}),
    };
    const [rows, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: { id: true, sellerShopName: true, email: true, phone: true, sellerStatus: true, commissionRate: true, createdAt: true, _count: { select: { products: true, orders: true } } },
        orderBy: { createdAt: 'desc' },
        take: pageSize,
        skip,
      }),
      this.prisma.user.count({ where }),
    ]);
    return toPaginated(rows.map((r) => ({ id: r.id, shopName: r.sellerShopName, email: r.email, phone: r.phone, status: r.sellerStatus, commissionRate: Number(r.commissionRate), createdAt: r.createdAt, productCount: r._count.products, orderCount: r._count.orders })), total, page, pageSize);
  }

  async findById(id: string): Promise<SellerRow | null> {
    const row = await this.prisma.user.findUnique({ where: { id, role: 'seller' }, select: { id: true, sellerShopName: true, email: true, phone: true, sellerStatus: true, commissionRate: true, createdAt: true } });
    if (!row) return null;
    return { id: row.id, shopName: row.sellerShopName, email: row.email, phone: row.phone, status: row.sellerStatus, commissionRate: Number(row.commissionRate), createdAt: row.createdAt };
  }

  async updateStoreSettings(sellerId: string, input: UpdateSellerStoreInput): Promise<void> {
    await this.prisma.user.update({ where: { id: sellerId }, data: input });
  }

  async getStoreSettings(sellerId: string): Promise<UpdateSellerStoreInput | null> {
    const row = await this.prisma.user.findUnique({ where: { id: sellerId }, select: { sellerShopName: true, sellerBio: true, sellerLogoUrl: true, sellerBannerUrl: true, sellerWhatsapp: true, sellerContactEmail: true, sellerContactPhone: true, sellerAddress: true, sellerCity: true, sellerCountry: true } });
    if (!row) return null;
    return {
      sellerShopName: row.sellerShopName ?? undefined,
      sellerBio: row.sellerBio ?? undefined,
      sellerLogoUrl: row.sellerLogoUrl ?? undefined,
      sellerBannerUrl: row.sellerBannerUrl ?? undefined,
      sellerWhatsapp: row.sellerWhatsapp ?? undefined,
      sellerContactEmail: row.sellerContactEmail ?? undefined,
      sellerContactPhone: row.sellerContactPhone ?? undefined,
      sellerAddress: row.sellerAddress ?? undefined,
      sellerCity: row.sellerCity ?? undefined,
      sellerCountry: row.sellerCountry ?? undefined,
    };
  }
}

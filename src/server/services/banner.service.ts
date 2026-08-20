import { prisma, isDatabaseConfigured } from '@/lib/db';

export const HOME_BANNER_PLACEMENTS = { HERO: 'HOME_HERO', PROMO_1: 'HOME_PROMO_1', PROMO_2: 'HOME_PROMO_2', MID: 'HOME_MID', CATEGORY: 'HOME_CATEGORY', SELLER: 'HOME_SELLER' } as const;
type BannerPlacement = typeof HOME_BANNER_PLACEMENTS[keyof typeof HOME_BANNER_PLACEMENTS];

export type BannerRow = { id: string; key: string; placement: string; title: string | null; subtitle: string | null; ctaLabel: string | null; href: string | null; desktopImageUrl: string; mobileImageUrl: string | null; startAt: Date | null; endAt: Date | null; sortOrder: number; autoSlide: boolean; durationMs: number; isActive: boolean };

const placementAliases: Record<string, string[]> = {
  HOME_HERO: ['HOME_HERO', 'hero'],
  HOME_PROMO_1: ['HOME_PROMO_1', 'promo_1'],
  HOME_PROMO_2: ['HOME_PROMO_2', 'promo_2', 'campaign'],
  HOME_MID: ['HOME_MID', 'mid'],
  HOME_CATEGORY: ['HOME_CATEGORY', 'category'],
  HOME_SELLER: ['HOME_SELLER', 'seller'],
  hero: ['hero', 'HOME_HERO'],
  mid: ['mid', 'HOME_MID'],
  campaign: ['campaign', 'HOME_PROMO_2'],
};

function nowWindowSql() { return `("startAt" IS NULL OR "startAt" <= NOW()) AND ("endAt" IS NULL OR "endAt" >= NOW())`; }
export function normalizeBannerPlacement(placement: string): BannerPlacement | string { return placementAliases[placement]?.[0] ?? placement; }

export async function listActiveBanners(placement: string, limit = 12): Promise<BannerRow[]> {
  if (!isDatabaseConfigured()) return [];
  const aliases = placementAliases[placement] ?? [placement];
  const placeholders = aliases.map((_, index) => `$${index + 1}`).join(', ');
  const limitParam = `$${aliases.length + 1}`;
  return prisma.$queryRawUnsafe<BannerRow[]>(
    `SELECT "id","key","placement","title","subtitle","ctaLabel","href","desktopImageUrl","mobileImageUrl","startAt","endAt","sortOrder","autoSlide","durationMs","isActive" FROM "Banner" WHERE "placement" IN (${placeholders}) AND "isActive" = true AND ${nowWindowSql()} ORDER BY "sortOrder" ASC, "createdAt" DESC LIMIT ${limitParam}`,
    ...aliases,
    Math.min(Math.max(limit, 1), 50),
  );
}

export async function listAllBanners(): Promise<BannerRow[]> {
  if (!isDatabaseConfigured()) return [];
  return prisma.$queryRawUnsafe<BannerRow[]>(`SELECT "id","key","placement","title","subtitle","ctaLabel","href","desktopImageUrl","mobileImageUrl","startAt","endAt","sortOrder","autoSlide","durationMs","isActive" FROM "Banner" ORDER BY "placement" ASC, "sortOrder" ASC, "createdAt" DESC`);
}

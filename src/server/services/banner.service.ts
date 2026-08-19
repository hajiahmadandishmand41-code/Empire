import { prisma, isDatabaseConfigured } from '@/lib/db';

export type BannerRow = {
  id: string;
  key: string;
  placement: string;
  title: string | null;
  subtitle: string | null;
  ctaLabel: string | null;
  href: string | null;
  desktopImageUrl: string;
  mobileImageUrl: string | null;
  startAt: Date | null;
  endAt: Date | null;
  sortOrder: number;
  autoSlide: boolean;
  durationMs: number;
  isActive: boolean;
};

function nowWindowSql() {
  return `("startAt" IS NULL OR "startAt" <= NOW()) AND ("endAt" IS NULL OR "endAt" >= NOW())`;
}

export async function listActiveBanners(placement: string, limit = 12): Promise<BannerRow[]> {
  if (!isDatabaseConfigured()) return [];
  const rows = await prisma.$queryRawUnsafe<BannerRow[]>(
    `SELECT "id","key","placement","title","subtitle","ctaLabel","href","desktopImageUrl","mobileImageUrl","startAt","endAt","sortOrder","autoSlide","durationMs","isActive"
     FROM "Banner"
     WHERE "placement" = $1 AND "isActive" = true AND ${nowWindowSql()}
     ORDER BY "sortOrder" ASC, "createdAt" DESC
     LIMIT $2`,
    placement,
    Math.min(Math.max(limit, 1), 50),
  );
  return rows;
}

export async function listAllBanners(): Promise<BannerRow[]> {
  if (!isDatabaseConfigured()) return [];
  return prisma.$queryRawUnsafe<BannerRow[]>(
    `SELECT "id","key","placement","title","subtitle","ctaLabel","href","desktopImageUrl","mobileImageUrl","startAt","endAt","sortOrder","autoSlide","durationMs","isActive"
     FROM "Banner" ORDER BY "placement" ASC, "sortOrder" ASC, "createdAt" DESC`,
  );
}

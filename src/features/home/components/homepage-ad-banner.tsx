import { Prisma } from '@prisma/client';
import { prisma, isDatabaseConfigured } from '@/lib/db';
import Link from 'next/link';

type Props = { locale: string };

const copy = {
  fa: { title: 'titleFa', subtitle: 'subtitleFa' },
  ps: { title: 'titlePs', subtitle: 'subtitlePs' },
  en: { title: 'titleEn', subtitle: 'subtitleEn' },
} as const;

export async function HomepageAdBanner({ locale }: Props) {
  if (!isDatabaseConfigured()) return null;
  try {
    const rows = await prisma.$queryRaw<Record<string, unknown>[]>(Prisma.sql`
      SELECT "titleFa","titlePs","titleEn","subtitleFa","subtitlePs","subtitleEn","imageUrl","href"
      FROM "HomepageAdvertisement"
      WHERE "isActive" = true
        AND ("startsAt" IS NULL OR "startsAt" <= NOW())
        AND ("endsAt" IS NULL OR "endsAt" >= NOW())
      ORDER BY "sortOrder" ASC, "createdAt" DESC
      LIMIT 1
    `);
    const ad = rows[0];
    if (!ad) return null;
    const keys = copy[locale as keyof typeof copy] ?? copy.fa;
    const title = String(ad[keys.title] ?? '');
    const subtitle = String(ad[keys.subtitle] ?? '');
    const href = typeof ad.href === 'string' && ad.href.length > 0 ? ad.href : '/shop';
    const imageUrl = typeof ad.imageUrl === 'string' ? ad.imageUrl : '';

    return (
      <section className="mx-auto max-w-screen-xl px-3 pt-3 sm:px-6 sm:pt-4" aria-label="Advertisement">
        <Link href={href} className="group relative block overflow-hidden rounded-2xl border border-primary/15 bg-gradient-to-r from-primary via-rose-600 to-purple-600 shadow-premium">
          {imageUrl && <div className="absolute inset-0 bg-cover bg-center opacity-25 transition-transform duration-700 group-hover:scale-105" style={{ backgroundImage: `url(${imageUrl})` }} aria-hidden="true" />}
          <div className="absolute -inset-y-4 -start-1/2 w-1/3 rotate-[18deg] bg-white/15 blur-2xl animate-[shimmer_5s_linear_infinite]" aria-hidden="true" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 via-transparent to-black/20" aria-hidden="true" />
          <div className="relative flex min-h-[110px] items-center justify-between gap-5 px-5 py-5 sm:min-h-[132px] sm:px-8">
            <div className="min-w-0 text-white">
              <span className="mb-1 inline-flex rounded-full bg-white/15 px-2.5 py-1 text-[10px] font-extrabold uppercase tracking-wider backdrop-blur-sm">Sponsored</span>
              <h2 className="text-lg font-black sm:text-2xl">{title}</h2>
              {subtitle && <p className="mt-1 max-w-2xl text-xs leading-5 text-white/85 sm:text-sm">{subtitle}</p>}
            </div>
            <span className="hidden shrink-0 rounded-xl bg-white px-4 py-2.5 text-xs font-extrabold text-primary shadow-sm sm:inline-flex">{locale === 'en' ? 'Shop now' : locale === 'ps' ? 'اوس واخلئ' : 'اکنون خرید کنید'}</span>
          </div>
        </Link>
      </section>
    );
  } catch (error) {
    console.error('[homepage-ad-banner]', error);
    return null;
  }
}

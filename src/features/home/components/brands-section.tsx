import Image from 'next/image';
import { Tags, ArrowLeft, BadgeCheck } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { prisma, isDatabaseConfigured } from '@/lib/db';

type Locale = 'fa' | 'ps' | 'en';
const copy = { fa:{title:'برندهای ایشاپ',subtitle:'برندهای مستقل را کشف کنید.',all:'همه برندها',brand:'برند'}, ps:{title:'د ایشاپ برانډونه',subtitle:'خپلواک برانډونه ومومئ.',all:'ټول برانډونه',brand:'برانډ'}, en:{title:'Eshop brands',subtitle:'Discover independent brands.',all:'View all brands',brand:'Brand'} } as const;

export async function BrandsSection({ locale }: { locale: Locale }) {
  if (!isDatabaseConfigured()) return null;
  const brands = await prisma.$queryRaw<Array<{id:string;slug:string;name:string;logoUrl:string|null}>>`
    SELECT "id","slug","name","logoUrl" FROM "SellerBrand"
    WHERE "isActive"=true AND "name" IS NOT NULL AND length(trim("name"))>1
      AND EXISTS (SELECT 1 FROM "Product" p WHERE p."brandId"="SellerBrand"."id" AND p."isActive"=true)
    ORDER BY "updatedAt" DESC LIMIT 10
  `;
  if (!brands.length) return null;
  const t = copy[locale];
  return <section aria-labelledby="brands-title" className="border-b border-border bg-card py-5 sm:py-7">
    <div className="mx-auto max-w-screen-xl px-3 sm:px-6">
      <div className="mb-4 flex items-center justify-between gap-3"><div className="flex min-w-0 items-center gap-2.5"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><Tags className="h-4 w-4"/></div><div className="min-w-0"><h2 id="brands-title" className="truncate text-sm font-black sm:text-lg">{t.title}</h2><p className="mt-0.5 line-clamp-1 text-[10px] text-muted-foreground sm:text-xs">{t.subtitle}</p></div></div><Link href="/brands" className="flex min-h-9 items-center gap-1 rounded-xl border border-border px-3 text-[10px] font-bold text-muted-foreground hover:border-primary/30 hover:text-primary sm:text-xs">{t.all}<ArrowLeft className="h-3 w-3 rtl:rotate-180"/></Link></div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
        {brands.map((brand) => <Link key={brand.id} href={`/brands/${brand.slug}` as never} className="group flex min-w-0 items-center gap-2 rounded-2xl border border-border bg-background p-2.5 transition hover:border-primary/30 hover:bg-primary/5"><span className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-border bg-card">{brand.logoUrl?<Image src={brand.logoUrl} alt={brand.name} fill sizes="48px" className="object-cover"/>:<span className="text-sm font-black text-primary">{brand.name.charAt(0)}</span>}</span><span className="min-w-0"><span className="block truncate text-xs font-black group-hover:text-primary">{brand.name}</span><span className="mt-1 flex items-center gap-1 text-[9px] text-muted-foreground"><BadgeCheck className="h-3 w-3 text-emerald-500"/>{t.brand}</span></span></Link>)}
      </div>
    </div>
  </section>;
}

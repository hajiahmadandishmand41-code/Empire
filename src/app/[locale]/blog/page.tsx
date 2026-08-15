import type { Metadata } from 'next';
import { setRequestLocale } from 'next-intl/server';

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/$/, '');

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const title = 'وبلاگ | Empire Shop';
  const description = 'مقالات، راهنماها و اخبار امپایر شاپ — خرید هوشمند در افغانستان';
  return {
    title,
    description,
    alternates: {
      canonical: `${SITE_URL}/${locale}/blog`,
      languages: {
        fa: `${SITE_URL}/fa/blog`,
        ps: `${SITE_URL}/ps/blog`,
        en: `${SITE_URL}/en/blog`,
      },
    },
    openGraph: { title, description, type: 'website', url: `${SITE_URL}/${locale}/blog` },
    twitter: { card: 'summary', title, description },
  };
}

/**
 * Blog index — placeholder. Wire up a CMS or a Prisma `Post` model later.
 * Kept intentionally simple so it can be replaced without breaking links.
 */
export default async function BlogPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  void locale;

  const posts: Array<{ slug: string; title: string; excerpt: string }> = [];

  return (
    <main id="main" className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-bold text-foreground">وبلاگ</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        به‌زودی مطالب تازه اینجا منتشر می‌شود.
      </p>

      {posts.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
          هنوز مطلبی منتشر نشده است.
        </div>
      ) : (
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {posts.map((p) => (
            <li key={p.slug} className="rounded-xl border border-border bg-card p-4">
              <h2 className="font-semibold text-foreground">{p.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.excerpt}</p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

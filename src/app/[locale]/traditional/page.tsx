import { redirect } from 'next/navigation';

export default async function TraditionalPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(`/${locale}/categories`);
}

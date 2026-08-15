import { Container } from '@/components/layout/container';
import { requireAuth } from '@/lib/auth/roles';
import { ProfileView } from '@/features/profile';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ locale: string }>;
}

export default async function ProfilePage({ params }: Props) {
  const { locale } = await params;
  const user = await requireAuth({ locale });

  return (
    <Container size="lg" className="py-10">
      <ProfileView user={user} locale={locale} />
    </Container>
  );
}

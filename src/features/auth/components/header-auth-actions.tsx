'use client';

import { LogIn, UserCircle2 } from 'lucide-react';
import { Link } from '@/i18n/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';
import { useTranslations } from 'next-intl';

export function HeaderAuthActions() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const t = useTranslations('siteHeader');

  if (isLoading) {
    return <div className="h-9 w-24 animate-pulse rounded-lg bg-muted" aria-hidden="true" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-1.5">
        <Button asChild size="sm" variant="outline" className="h-9 rounded-lg px-3 text-xs font-semibold">
          <Link href="/auth/login">
            <LogIn className="h-3.5 w-3.5" aria-hidden="true" />
            {t('login')}
          </Link>
        </Button>
        <Button asChild size="sm" className="h-9 rounded-lg px-3 text-xs font-bold shadow-sm">
          <Link href="/auth/register">{t('register')}</Link>
        </Button>
      </div>
    );
  }

  return (
    <Button asChild size="sm" variant="ghost" className="h-9 max-w-40 rounded-lg px-2.5 text-xs font-semibold">
      <Link href="/profile" className="flex min-w-0 items-center gap-1.5">
        <UserCircle2 className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span className="truncate">{user?.name ?? t('profile')}</span>
      </Link>
    </Button>
  );
}

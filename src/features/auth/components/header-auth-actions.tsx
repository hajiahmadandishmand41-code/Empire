'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { User, LogOut, Store, LogIn, UserPlus, ChevronDown, ShieldCheck } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';

type MeRole = 'customer' | 'seller' | 'admin';
interface MeUser { id: string; fullName: string; role: MeRole; email?: string; }

export function HeaderAuthActions() {
  const router = useRouter();
  const t = useTranslations('siteHeader');
  const [user, setUser] = useState<MeUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin', cache: 'no-store' })
      .then((r) => r.json())
      .then((d) => { if (!cancelled && d?.ok && d?.data?.user) setUser(d.data.user as MeUser); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoaded(true); });
    return () => { cancelled = true; };
  }, []);

  async function onLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    setUser(null);
    router.push('/auth/register');
    router.refresh();
  }

  if (!loaded) return <div className="h-9 w-24 animate-pulse rounded-xl bg-muted" aria-hidden />;

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm shadow-sm transition-colors hover:border-primary/30 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={t('accountLabel')}
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary" aria-hidden="true">
              {user.fullName.charAt(0)}
            </span>
            <span className="hidden text-xs font-semibold sm:inline-block">{t('accountLabel')}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-60">
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="text-sm font-bold">{user.fullName}</span>
            {user.email && <span className="text-xs text-muted-foreground">{user.email}</span>}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user.role === 'admin' && (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex w-full items-center gap-2">
                <ShieldCheck className="h-4 w-4" aria-hidden="true" />
                <span>{t('adminPanel')}</span>
              </Link>
            </DropdownMenuItem>
          )}
          {(user.role === 'seller' || user.role === 'admin') && (
            <DropdownMenuItem asChild>
              <Link href="/seller" className="flex w-full items-center gap-2">
                <Store className="h-4 w-4" aria-hidden="true" />
                <span>{t('sellerPanel')}</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex w-full items-center gap-2">
              <User className="h-4 w-4" aria-hidden="true" />
              <span>{t('profile')}</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onLogout} className="flex w-full items-center gap-2 text-destructive">
            <LogOut className="h-4 w-4" aria-hidden="true" />
            <span>{t('logout')}</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button asChild size="sm" variant="outline" className="h-9 gap-1.5 rounded-xl border-primary/20 px-3 text-xs font-semibold hover:border-primary/40 hover:bg-primary/5">
        <Link href="/auth/login"><LogIn className="h-3.5 w-3.5" aria-hidden="true" />{t('login')}</Link>
      </Button>
      <Button asChild size="sm" className="h-9 gap-1.5 rounded-xl bg-primary px-3 text-xs font-bold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90">
        <Link href="/auth/register"><UserPlus className="h-3.5 w-3.5" aria-hidden="true" />{t('registerFree')}</Link>
      </Button>
    </div>
  );
}

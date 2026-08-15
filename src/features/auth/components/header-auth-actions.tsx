'use client';

import { useEffect, useState } from 'react';
import { Link, useRouter } from '@/i18n/routing';
import { User, LogOut, LayoutDashboard, Store, UserCircle, LogIn, UserPlus, ChevronDown } from 'lucide-react';
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

interface MeUser {
  id: string;
  fullName: string;
  role: MeRole;
  email?: string;
}

export function HeaderAuthActions() {
  const router = useRouter();
  const [user, setUser]     = useState<MeUser | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/auth/me', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        if (cancelled) return;
        if (d?.ok && d?.data?.user) setUser(d.data.user as MeUser);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoaded(true));
    return () => { cancelled = true; };
  }, []);

  async function onLogout() {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
    setUser(null);
    router.push('/auth/login');
    router.refresh();
  }

  // Skeleton while loading
  if (!loaded) {
    return (
      <div className="flex items-center gap-2" aria-hidden>
        <div className="h-9 w-16 animate-pulse rounded-xl bg-muted" />
        <div className="h-9 w-24 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (user) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className="flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-sm shadow-sm transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            {/* Avatar circle with first letter */}
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-900/60 text-[11px] font-bold text-rose-700 dark:text-rose-300 shrink-0">
              {user.fullName.charAt(0)}
            </div>
            {/* "حساب شما" label — shown after login */}
            <span className="hidden text-xs font-medium text-foreground sm:inline-block">
              حساب شما
            </span>
            <ChevronDown className="h-3 w-3 text-muted-foreground" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel className="flex flex-col gap-1">
            <span className="text-sm font-semibold leading-none">{user.fullName}</span>
            {user.email && (
              <span className="text-xs text-muted-foreground leading-none mt-0.5">{user.email}</span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          {user.role === 'admin' && (
            <DropdownMenuItem asChild>
              <Link href="/admin" className="flex w-full items-center gap-2 cursor-pointer">
                <LayoutDashboard className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span>پنل مدیریت</span>
              </Link>
            </DropdownMenuItem>
          )}
          {user.role === 'seller' && (
            <DropdownMenuItem asChild>
              <Link href="/seller" className="flex w-full items-center gap-2 cursor-pointer">
                <Store className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span>پنل فروش</span>
              </Link>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem asChild>
            <Link href="/profile" className="flex w-full items-center gap-2 cursor-pointer">
              <User className="h-4 w-4 text-muted-foreground" aria-hidden />
              <span>پروفایل من</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={onLogout}
            className="flex w-full items-center gap-2 text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span>خروج از حساب</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Guest state — "ورود" before login
  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-9 gap-1.5 rounded-xl border-border px-3 text-xs font-medium text-foreground hover:border-rose-300 dark:hover:border-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-600 dark:hover:text-rose-400"
      >
        <Link href="/auth/login">
          <LogIn className="h-3.5 w-3.5" aria-hidden />
          ورود
        </Link>
      </Button>
      <Button
        asChild
        size="sm"
        className="h-9 gap-1.5 rounded-xl bg-rose-600 px-3 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition-all hover:-translate-y-0.5"
      >
        <Link href="/auth/register">
          <UserPlus className="h-3.5 w-3.5" aria-hidden />
          ثبت‌نام رایگان
        </Link>
      </Button>
    </div>
  );
}

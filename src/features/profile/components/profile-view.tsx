import * as React from 'react';
import { Link } from '@/i18n/routing';
import type { CurrentUser, CurrentUserRole } from '@/lib/auth/current-user';
import { LogoutButton } from './logout-button';
import { MyOrders } from './my-orders';
import { AccountNotifications } from './account-notifications';
import {
  User, ClipboardList, MapPin, Settings, Briefcase, ShieldCheck,
  Heart, ChevronLeft, Package, Mail, Phone as PhoneIcon, Calendar, Edit3,
} from 'lucide-react';

const ROLE_LABEL: Record<CurrentUserRole, string> = {
  customer: 'مشتری',
  seller: 'فروشنده',
  admin: 'مدیر',
};

const ROLE_COLOR: Record<CurrentUserRole, string> = {
  customer: 'bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-800/50',
  seller: 'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/50',
  admin: 'bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-800/50',
};

function formatJoinDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fa-IR');
  } catch {
    return iso;
  }
}

interface Props {
  user: CurrentUser;
  locale?: string;
}

interface QuickLink {
  href: string;
  label: string;
  sub: string;
  icon: React.ComponentType<{ className?: string }>;
  hoverBorder: string;
  iconStyle: string;
}

export function ProfileView({ user, locale = 'fa' }: Props) {
  const quickLinks: QuickLink[] = [
    {
      href: '/orders',
      label: 'سفارش‌ها',
      sub: 'پیگیری سفارش',
      icon: ClipboardList,
      hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
      iconStyle: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
    },
    {
      href: '/wishlist',
      label: 'علاقه‌مندی‌ها',
      sub: 'ذخیره‌شده‌ها',
      icon: Heart,
      hoverBorder: 'hover:border-rose-300 dark:hover:border-rose-700',
      iconStyle: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
    },
    {
      href: '/profile/addresses',
      label: 'آدرس‌ها',
      sub: 'آدرس ارسال',
      icon: MapPin,
      hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
      iconStyle: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
    },
    {
      href: '/settings',
      label: 'تنظیمات',
      sub: 'حساب و برنامه',
      icon: Settings,
      hoverBorder: 'hover:border-gray-300 dark:hover:border-gray-600',
      iconStyle: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400',
    },
  ];

  const roleLinks = [
    ...(user.role === 'customer' ? [] : []),
    ...(user.role === 'seller'
      ? [{ href: '/seller', label: 'پنل فروشنده', sub: 'مدیریت محصولات و سفارش‌ها', icon: Briefcase, style: 'text-teal-700 dark:text-teal-400 bg-gradient-to-r from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border-teal-200 dark:border-teal-800/50' }]
      : []),
    ...(user.role === 'admin'
      ? [{ href: '/admin', label: 'پنل مدیریت', sub: 'مدیریت کل پلتفرم', icon: ShieldCheck, style: 'text-purple-700 dark:text-purple-400 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30 border-purple-200 dark:border-purple-800/50' }]
      : []),
  ];


  return (
    <div className="space-y-4">
      {/* ── Hero card: Avatar + name + role ── */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        {/* Gradient banner */}
        <div className="relative h-24 overflow-hidden bg-gradient-to-br from-rose-600 via-rose-700 to-rose-900">
          <div className="absolute inset-0 opacity-[0.07]">
            <svg width="100%" height="100%">
              <defs>
                <pattern id="profile-hero-pattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="8" fill="none" stroke="white" strokeWidth="1.2" />
                  <circle cx="0" cy="0" r="8" fill="none" stroke="white" strokeWidth="1.2" />
                  <circle cx="40" cy="0" r="8" fill="none" stroke="white" strokeWidth="1.2" />
                  <circle cx="0" cy="40" r="8" fill="none" stroke="white" strokeWidth="1.2" />
                  <circle cx="40" cy="40" r="8" fill="none" stroke="white" strokeWidth="1.2" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#profile-hero-pattern)" />
            </svg>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/15 to-transparent" />
        </div>

        <div className="px-5 pb-5">
          {/* Avatar row */}
          <div className="flex items-end justify-between -mt-10 mb-4">
            <div className="relative">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl border-4 border-card bg-gradient-to-br from-rose-400 to-rose-600 text-2xl font-extrabold text-white shadow-lg ring-2 ring-rose-200/60 dark:ring-rose-700/40">
                {user.fullName.trim().charAt(0) || '👤'}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${ROLE_COLOR[user.role]}`}>
                {ROLE_LABEL[user.role]}
              </span>
              <LogoutButton />
            </div>
          </div>

          {/* Name & info */}
          <div className="space-y-1">
            <h1 className="text-xl font-extrabold text-foreground">{user.fullName}</h1>
            {user.email && (
              <p className="text-sm text-muted-foreground">{user.email}</p>
            )}
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3 w-3 shrink-0" aria-hidden />
              عضو از {formatJoinDate(user.createdAt)}
            </p>
          </div>
        </div>
      </div>

      {/* ── Quick action links ── */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {quickLinks.map(({ href, label, sub, icon: Icon, hoverBorder, iconStyle }) => (
          <Link
            key={href}
            href={href}
            className={`group flex flex-col items-center gap-2.5 rounded-2xl border border-border bg-card p-4 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${hoverBorder}`}
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110 ${iconStyle}`}>
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <p className="text-xs font-bold text-foreground">{label}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* ── Account info ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-bold text-foreground">اطلاعات حساب</h2>
          </div>
          <Link
            href="/profile/security"
            className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors"
          >
            <Edit3 className="h-3 w-3" aria-hidden />
            ویرایش
          </Link>
        </div>
        <dl className="grid sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x sm:divide-x-reverse divide-border">
          <div className="flex items-start gap-3 px-5 py-4">
            <Mail className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden />
            <div>
              <dt className="text-[10px] font-medium text-muted-foreground mb-0.5">ایمیل</dt>
              <dd className="text-sm font-semibold text-foreground" dir="ltr">
                {user.email ?? '—'}
              </dd>
            </div>
          </div>
          <div className="flex items-start gap-3 px-5 py-4">
            <PhoneIcon className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden />
            <div>
              <dt className="text-[10px] font-medium text-muted-foreground mb-0.5">شماره تماس</dt>
              <dd className="text-sm font-semibold text-foreground" dir="ltr">
                {user.phone ?? '—'}
              </dd>
            </div>
          </div>
        </dl>
      </div>

      {/* ── Role-specific links ── */}
      {roleLinks.length > 0 && (
        <div className="space-y-2.5">
          {roleLinks.map(({ href, label, sub, icon: Icon, style }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-between rounded-2xl border px-5 py-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${style}`}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-5 w-5" aria-hidden />
                <div>
                  <p className="text-sm font-bold">{label}</p>
                  <p className="text-[10px] opacity-70 mt-0.5">{sub}</p>
                </div>
              </div>
              <ChevronLeft className="h-4 w-4 opacity-50" aria-hidden />
            </Link>
          ))}
        </div>
      )}


      <AccountNotifications />

      {/* ── Recent orders ── */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" aria-hidden />
            <h2 className="text-sm font-bold text-foreground">آخرین سفارش‌ها</h2>
          </div>
          <Link
            href="/orders"
            className="flex items-center gap-1 text-[11px] text-rose-600 dark:text-rose-400 hover:text-rose-700 transition-colors"
          >
            همه سفارش‌ها
            <ChevronLeft className="h-3 w-3" aria-hidden />
          </Link>
        </div>
        <div className="p-5">
          <MyOrders locale={locale} />
        </div>
      </div>
    </div>
  );
}

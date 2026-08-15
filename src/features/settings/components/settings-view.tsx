'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import {
  Sun, Moon, Monitor, Bell, BellOff, Globe, Lock, User, ChevronLeft,
  Check, Smartphone, LogOut, Shield, Info, Volume2, VolumeX, Settings,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Props {
  locale?: string;
}

interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  icon?: React.ReactNode;
}

function SettingToggle({ label, description, checked, onChange, icon }: SettingToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            {icon}
          </div>
        )}
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          {description && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{description}</p>}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 transition-all duration-200',
          checked
            ? 'bg-rose-600 border-rose-600'
            : 'bg-muted border-border',
        )}
      >
        <span
          className={cn(
            /* bg-white intentional: toggle knob (white dot visible on both rose + muted tracks) */
            'inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-all duration-200',
            checked ? 'translate-x-1 rtl:-translate-x-5' : 'translate-x-1 rtl:-translate-x-1',
          )}
        />
      </button>
    </div>
  );
}

function SectionHeader({ title, icon }: { title: string; icon: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2.5 mb-2 px-1">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400">
        {icon}
      </div>
      <h2 className="text-sm font-bold text-foreground">{title}</h2>
    </div>
  );
}

export function SettingsView({ locale = 'fa' }: Props) {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [orderNotifications, setOrderNotifications] = useState(true);
  const [promoNotifications, setPromoNotifications] = useState(false);
  const [sound, setSound] = useState(true);

  useEffect(() => {
    setMounted(true);
    try {
      const saved = localStorage.getItem('empire:settings');
      if (saved) {
        const p = JSON.parse(saved);
        setNotifications(p.notifications ?? true);
        setOrderNotifications(p.orderNotifications ?? true);
        setPromoNotifications(p.promoNotifications ?? false);
        setSound(p.sound ?? true);
      }
    } catch { /* ignore */ }
  }, []);

  function savePrefs(updates: Record<string, boolean>) {
    try {
      const saved = localStorage.getItem('empire:settings');
      const existing = saved ? JSON.parse(saved) : {};
      localStorage.setItem('empire:settings', JSON.stringify({ ...existing, ...updates }));
    } catch { /* ignore */ }
    toast.success('تنظیمات ذخیره شد');
  }

  const themeOptions = [
    { value: 'light' as const, label: 'روشن', icon: <Sun className="h-4 w-4" />, sub: 'حالت روز' },
    { value: 'dark' as const, label: 'تاریک', icon: <Moon className="h-4 w-4" />, sub: 'حالت شب' },
    { value: 'system' as const, label: 'خودکار', icon: <Monitor className="h-4 w-4" />, sub: 'از سیستم' },
  ];

  const languages = [
    { code: 'fa', label: 'فارسی دری', flag: '🇦🇫', native: 'دری' },
    { code: 'ps', label: 'پښتو', flag: '🇦🇫', native: 'پښتو' },
    { code: 'en', label: 'English', flag: '🇺🇸', native: 'English' },
  ];

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-rose-600 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-6 sm:py-8 space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-gray-700 to-gray-900 shadow-md">
          <Settings className="h-5 w-5 text-white" aria-hidden />
        </div>
        <div>
          <h1 className="text-xl font-extrabold text-foreground">تنظیمات</h1>
          <p className="text-xs text-muted-foreground mt-0.5">شخصی‌سازی تجربه خرید شما</p>
        </div>
      </div>

      {/* ── Theme / Display ── */}
      <section>
        <SectionHeader title="ظاهر برنامه" icon={<Sun className="h-4 w-4" />} />
        <div className="rounded-2xl border border-border bg-card shadow-sm p-4">
          <p className="text-xs text-muted-foreground mb-3">حالت نمایش را انتخاب کنید</p>
          <div className="grid grid-cols-3 gap-2">
            {themeOptions.map((opt) => {
              const isActive = theme === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setTheme(opt.value);
                    toast.success(`حالت ${opt.label} فعال شد`);
                  }}
                  className={cn(
                    'flex flex-col items-center gap-2 rounded-xl border p-3.5 text-xs font-medium transition-all duration-200',
                    isActive
                      ? 'border-rose-400 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 shadow-sm'
                      : 'border-border bg-muted/30 text-muted-foreground hover:bg-muted/70 hover:text-foreground',
                  )}
                >
                  <div className={cn(
                    'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                    isActive ? 'bg-rose-100 dark:bg-rose-900/40 text-rose-600' : 'bg-muted text-muted-foreground',
                  )}>
                    {opt.icon}
                  </div>
                  <span>{opt.label}</span>
                  <span className={cn('text-[9px]', isActive ? 'text-rose-500' : 'text-muted-foreground/60')}>{opt.sub}</span>
                  {isActive && <Check className="h-3 w-3 text-rose-600 dark:text-rose-400" aria-hidden />}
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Language ── */}
      <section>
        <SectionHeader title="زبان" icon={<Globe className="h-4 w-4" />} />
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
          {languages.map((lang, i) => {
            const isActive = locale === lang.code;
            return (
              <Link
                key={lang.code}
                href={`/${lang.code}`}
                className={cn(
                  'flex items-center justify-between px-4 py-3.5 transition-colors',
                  i < languages.length - 1 && 'border-b border-border',
                  isActive
                    ? 'bg-rose-50/60 dark:bg-rose-950/20'
                    : 'hover:bg-muted/40',
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden>{lang.flag}</span>
                  <div>
                    <p className="text-sm font-semibold text-foreground">{lang.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{lang.native}</p>
                  </div>
                </div>
                {isActive ? (
                  <Check className="h-4 w-4 text-rose-600 dark:text-rose-400" aria-hidden />
                ) : (
                  <ChevronLeft className="h-4 w-4 text-muted-foreground" aria-hidden />
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── Notifications ── */}
      <section>
        <SectionHeader title="اعلان‌ها" icon={<Bell className="h-4 w-4" />} />
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
          <div className="px-4">
            <SettingToggle
              label="اعلان‌ها"
              description="دریافت همه اعلان‌های برنامه"
              checked={notifications}
              onChange={(v) => { setNotifications(v); savePrefs({ notifications: v }); }}
              icon={notifications ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            />
          </div>
          <div className={cn('px-4 transition-opacity duration-200', !notifications && 'opacity-40 pointer-events-none')}>
            <SettingToggle
              label="وضعیت سفارش"
              description="اطلاع از تغییر وضعیت سفارش‌ها"
              checked={orderNotifications}
              onChange={(v) => { setOrderNotifications(v); savePrefs({ orderNotifications: v }); }}
              icon={<Smartphone className="h-4 w-4" />}
            />
          </div>
          <div className={cn('px-4 transition-opacity duration-200', !notifications && 'opacity-40 pointer-events-none')}>
            <SettingToggle
              label="پیشنهادات ویژه"
              description="دریافت اخبار تخفیف‌ها و جشنواره‌ها"
              checked={promoNotifications}
              onChange={(v) => { setPromoNotifications(v); savePrefs({ promoNotifications: v }); }}
              icon={<Bell className="h-4 w-4" />}
            />
          </div>
          <div className="px-4">
            <SettingToggle
              label="صدای اعلان"
              description="پخش صدا هنگام دریافت اعلان"
              checked={sound}
              onChange={(v) => { setSound(v); savePrefs({ sound: v }); }}
              icon={sound ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            />
          </div>
        </div>
      </section>

      {/* ── Account ── */}
      <section>
        <SectionHeader title="حساب کاربری" icon={<User className="h-4 w-4" />} />
        <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden divide-y divide-border">
          {[
            { href: '/profile', label: 'پروفایل من', sub: 'مشاهده و ویرایش اطلاعات', icon: User },
            { href: '/profile/security', label: 'تنظیمات امنیتی', sub: 'رمز عبور و احراز هویت', icon: Lock },
            { href: '/profile/addresses', label: 'آدرس‌های من', sub: 'مدیریت آدرس‌های ارسال', icon: Globe },
          ].map(({ href, label, sub, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center justify-between px-4 py-4 transition-colors hover:bg-muted/40"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-muted-foreground">
                  <Icon className="h-4 w-4" aria-hidden />
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{sub}</p>
                </div>
              </div>
              <ChevronLeft className="h-4 w-4 text-muted-foreground shrink-0" aria-hidden />
            </Link>
          ))}
        </div>
      </section>

      {/* ── App Info ── */}
      <section>
        <div className="rounded-2xl border border-border bg-card shadow-sm p-5 text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-rose-700 shadow-md mb-2">
            <span className="text-2xl font-black text-white">E</span>
          </div>
          <p className="text-sm font-bold text-foreground">Empire Shop</p>
          <div className="flex items-center justify-center gap-1.5 text-muted-foreground">
            <Info className="h-3 w-3" aria-hidden />
            <span className="text-xs">نسخه ۱.۰ — بزرگ‌ترین فروشگاه آنلاین افغانستان</span>
          </div>
          <div className="flex justify-center gap-4 pt-2">
            <Link href="/terms" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              حریم خصوصی
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/terms" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              شرایط استفاده
            </Link>
            <span className="text-muted-foreground/30">•</span>
            <Link href="/contact" className="text-[11px] text-muted-foreground hover:text-foreground transition-colors">
              تماس با ما
            </Link>
          </div>
        </div>
      </section>

      {/* ── Logout ── */}
      <section>
        <button
          type="button"
          onClick={async () => {
            try {
              await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' });
            } finally {
              window.location.href = '/';
            }
          }}
          className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-red-200 dark:border-red-800/50 bg-red-50 dark:bg-red-950/20 px-4 py-4 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
        >
          <LogOut className="h-4 w-4" aria-hidden />
          خروج از حساب
        </button>
      </section>
    </div>
  );
}

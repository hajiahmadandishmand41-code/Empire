'use client';

import * as React from 'react';
import { Bell, BellOff, Check, CheckCheck, Info, ShoppingBag, AlertTriangle, Star } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { formatDate } from '@/features/admin/lib/format';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string; // info, success, warning, error, order
  isRead: boolean;
  link?: string | null;
  createdAt: string;
}

const TYPE_CONFIG: Record<string, { icon: React.ComponentType<{className?: string}>; color: string; bg: string }> = {
  info: { icon: Info, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' },
  success: { icon: Star, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-100 dark:bg-emerald-900/40' },
  warning: { icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-900/40' },
  error: { icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'bg-red-100 dark:bg-red-900/40' },
  order: { icon: ShoppingBag, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-100 dark:bg-rose-900/40' },
};

export default function SellerNotificationsPage() {
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [filter, setFilter] = React.useState<'all' | 'unread'>('all');

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/seller/notifications?unread=${filter === 'unread'}`, {
        credentials: 'include',
      });
      const json = await res.json();
      if (json?.ok) {
        setNotifications(json.data?.notifications ?? []);
        setUnreadCount(json.data?.unreadCount ?? 0);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }

  React.useEffect(() => { load(); }, [filter]);

  async function markRead(id: string) {
    try {
      await fetch('/api/seller/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  }

  async function markAllRead() {
    try {
      await fetch('/api/seller/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('همه اعلان‌ها خوانده‌شده علامت‌گذاری شدند');
    } catch {
      toast.error('خطا در به‌روزرسانی');
    }
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold text-navy-800 dark:text-white flex items-center gap-2">
            <Bell className="h-6 w-6 text-rose-500" />
            اعلان‌ها
            {unreadCount > 0 && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-rose-600 px-1.5 text-xs font-bold text-white">
                {unreadCount}
              </span>
            )}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            آخرین رویدادها و هشدارهای مربوط به فروشگاه شما
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-border overflow-hidden text-xs font-medium">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={cn(
                'px-3 py-1.5 transition-colors',
                filter === 'all'
                  ? 'bg-rose-600 text-white'
                  : 'hover:bg-muted text-muted-foreground',
              )}
            >
              همه
            </button>
            <button
              type="button"
              onClick={() => setFilter('unread')}
              className={cn(
                'px-3 py-1.5 transition-colors',
                filter === 'unread'
                  ? 'bg-rose-600 text-white'
                  : 'hover:bg-muted text-muted-foreground',
              )}
            >
              خوانده‌نشده
              {unreadCount > 0 && (
                <span className="mr-1 rounded-full bg-rose-500/20 px-1.5 py-0.5 text-rose-600 dark:text-rose-400">
                  {unreadCount}
                </span>
              )}
            </button>
          </div>
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllRead} className="h-8 text-xs">
              <CheckCheck className="h-3.5 w-3.5" />
              خواندن همه
            </Button>
          )}
        </div>
      </header>

      <Card className="divide-y divide-border overflow-hidden p-0">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-rose-500 border-t-transparent" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-muted-foreground">
            <BellOff className="h-10 w-10 opacity-30" />
            <div className="text-center">
              <p className="font-medium">اعلانی وجود ندارد</p>
              <p className="text-xs mt-1">
                {filter === 'unread'
                  ? 'همه اعلان‌ها خوانده شده‌اند.'
                  : 'در حال حاضر اعلانی برای شما وجود ندارد.'}
              </p>
            </div>
          </div>
        ) : (
          notifications.map((notif) => {
            const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info;
            const Icon = cfg.icon;
            return (
              <div
                key={notif.id}
                className={cn(
                  'flex gap-4 px-5 py-4 transition-colors',
                  !notif.isRead
                    ? 'bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50/60'
                    : 'hover:bg-muted/30',
                )}
              >
                {/* Icon */}
                <div
                  className={cn(
                    'flex h-9 w-9 shrink-0 items-center justify-center rounded-full',
                    cfg.bg,
                  )}
                >
                  <Icon className={cn('h-4 w-4', cfg.color)} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className={cn(
                        'text-sm leading-snug',
                        !notif.isRead ? 'font-semibold text-foreground' : 'font-medium text-foreground/80',
                      )}
                    >
                      {notif.title}
                    </p>
                    <time className="shrink-0 text-[11px] text-muted-foreground">
                      {new Date(notif.createdAt).toLocaleDateString('fa-IR')}
                    </time>
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                    {notif.message}
                  </p>
                  {notif.link && (
                    <a
                      href={notif.link}
                      className="mt-1 inline-flex text-xs font-medium text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:underline"
                    >
                      مشاهده جزئیات ←
                    </a>
                  )}
                </div>

                {/* Mark as read */}
                {!notif.isRead && (
                  <button
                    type="button"
                    onClick={() => markRead(notif.id)}
                    title="علامت‌گذاری به عنوان خوانده‌شده"
                    className="shrink-0 flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground hover:border-emerald-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition-colors"
                  >
                    <Check className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </Card>

      {notifications.length > 0 && (
        <p className="text-center text-xs text-muted-foreground">
          {notifications.length} اعلان نمایش داده شده
        </p>
      )}
    </div>
  );
}

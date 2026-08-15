'use client';

import * as React from 'react';
import { Bell, CheckCircle2, Clock3, AlertTriangle } from 'lucide-react';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
}

function iconFor(type: string) {
  if (type === 'success') return CheckCircle2;
  if (type === 'warning' || type === 'error') return AlertTriangle;
  return Clock3;
}

export function AccountNotifications() {
  const [items, setItems] = React.useState<Notification[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let active = true;
    fetch('/api/notifications?limit=6', { credentials: 'same-origin' })
      .then((res) => (res.ok ? res.json() : null))
      .then((payload) => {
        if (active && payload?.ok && Array.isArray(payload.data?.items)) {
          setItems(payload.data.items as Notification[]);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  if (loading || items.length === 0) return null;

  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <Bell className="h-4 w-4 text-rose-500" aria-hidden />
        <h2 className="text-sm font-bold text-foreground">اعلان‌های اخیر</h2>
      </div>
      <div className="divide-y divide-border">
        {items.map((item) => {
          const Icon = iconFor(item.type);
          return (
            <div key={item.id} className="flex gap-3 px-5 py-4">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm font-bold text-foreground">{item.title}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.message}</p>
                <time className="mt-1.5 block text-[10px] text-muted-foreground" dateTime={item.createdAt}>
                  {new Date(item.createdAt).toLocaleDateString('fa-IR')}
                </time>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
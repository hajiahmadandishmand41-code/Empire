'use client';
import { useEffect, useState } from 'react';

export default function NotificationBadge() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    fetch('/api/seller/notifications?unread=true&sellerId=1')
      .then(r => r.json())
      .then(d => setCount(d.count || 0))
      .catch(() => {});
  }, []);

  if (count === 0) return null;
  return (
    <span className="mr-auto min-w-[1.25rem] h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center px-1 font-bold">
      {count > 99 ? '99+' : count}
    </span>
  );
}

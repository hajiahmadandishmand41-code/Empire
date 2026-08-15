'use client';

import { useState } from 'react';
import { useRouter } from '@/i18n/routing';
import { Button } from '@/components/ui/button';

interface Props {
  label?: string;
}

export function LogoutButton({ label = 'خروج از حساب' }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function onLogout() {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
      });
      router.replace('/auth/login');
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button type="button" variant="outline" onClick={onLogout} disabled={loading}>
      {loading ? 'در حال خروج…' : label}
    </Button>
  );
}

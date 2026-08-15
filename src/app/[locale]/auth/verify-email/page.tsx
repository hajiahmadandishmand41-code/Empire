'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function VerifyEmailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) ?? 'fa';
  const token = searchParams.get('token') ?? '';

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('توکن تأیید موجود نیست');
      return;
    }

    fetch('/api/auth/verify-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) {
          setStatus('success');
          setMessage(json.data?.message ?? 'ایمیل با موفقیت تأیید شد');
        } else {
          setStatus('error');
          setMessage(json.error?.message ?? 'خطا در تأیید ایمیل');
        }
      })
      .catch(() => {
        setStatus('error');
        setMessage('خطای شبکه');
      });
  }, [token]);

  return (
    <Card className="shadow-lg">
      <CardContent className="pt-10 pb-8 text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">در حال تأیید ایمیل…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
              <CheckCircle className="h-8 w-8 text-emerald-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">تأیید موفق!</h2>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <Button asChild className="mt-6">
              <Link href={`/${locale}`}>بازگشت به خانه</Link>
            </Button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold">خطا در تأیید</h2>
            <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild variant="outline">
                <Link href={`/${locale}/auth/login`}>بازگشت به ورود</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { Smartphone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function OtpLoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) ?? 'fa';

  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  const startCountdown = () => {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown((v) => {
        if (v <= 1) { clearInterval(interval); return 0; }
        return v - 1;
      });
    }, 1000);
  };

  const sendOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, step: 'send' }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? 'خطایی رخ داد');
        return;
      }
      setStep('otp');
      startCountdown();
    } catch {
      setError('خطای شبکه. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp, step: 'verify' }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error?.message ?? 'کد نادرست است');
        return;
      }
      router.push(`/${locale}`);
    } catch {
      setError('خطای شبکه. لطفاً دوباره تلاش کنید.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 'phone') sendOtp();
    else verifyOtp();
  };

  return (
    <Card className="shadow-lg">
      <CardHeader className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Smartphone className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl">ورود با کد OTP</CardTitle>
        <CardDescription>
          {step === 'phone'
            ? 'شماره تلفن خود را وارد کنید تا کد تأیید دریافت کنید'
            : `کد ۶ رقمی ارسال شده به ${phone} را وارد کنید`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {step === 'phone' ? (
            <div className="space-y-2">
              <Label htmlFor="phone">شماره تلفن</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+9370000000"
                required
                dir="ltr"
                autoComplete="tel"
              />
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="otp">کد تأیید</Label>
                <Input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="۰۰۰۰۰۰"
                  required
                  dir="ltr"
                  autoComplete="one-time-code"
                  className="text-center text-2xl tracking-widest"
                />
              </div>
              <div className="text-center">
                {countdown > 0 ? (
                  <p className="text-sm text-muted-foreground">
                    ارسال مجدد در {countdown} ثانیه
                  </p>
                ) : (
                  <button
                    type="button"
                    onClick={sendOtp}
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    ارسال مجدد کد
                  </button>
                )}
              </div>
            </>
          )}

          {error && (
            <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? '…'
              : step === 'phone'
                ? 'دریافت کد تأیید'
                : 'تأیید و ورود'}
          </Button>

          {step === 'phone' && (
            <p className="text-center text-sm text-muted-foreground">
              ورود با رمز عبور؟{' '}
              <Link href={`/${locale}/auth/login`} className="font-medium text-primary hover:underline">
                اینجا کلیک کنید
              </Link>
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}

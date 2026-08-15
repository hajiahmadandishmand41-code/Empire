'use client';

import { useEffect, useState } from 'react';
import { Shield, Mail, Phone, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface UserInfo {
  id: string;
  email: string | null;
  phone: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
}

export default function SecurityPage() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  // Email verification
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // Phone verification
  const [phoneSending, setPhoneSending] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');
  const [phoneStep, setPhoneStep] = useState<'send' | 'verify'>('send');
  const [phoneMsg, setPhoneMsg] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((json) => {
        if (json.ok) setUser(json.data.user);
      })
      .finally(() => setLoading(false));
  }, []);

  const sendEmailVerification = async () => {
    setEmailSending(true);
    try {
      await fetch('/api/auth/send-verification-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: 'fa' }),
      });
      setEmailSent(true);
    } finally {
      setEmailSending(false);
    }
  };

  const sendPhoneOtp = async () => {
    setPhoneSending(true);
    setPhoneMsg('');
    try {
      const res = await fetch('/api/auth/send-phone-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
      const json = await res.json();
      if (json.ok) { setPhoneStep('verify'); setPhoneMsg('کد تأیید ارسال شد.'); }
      else setPhoneMsg(json.error?.message ?? 'خطایی رخ داد');
    } finally {
      setPhoneSending(false);
    }
  };

  const verifyPhone = async () => {
    setPhoneSending(true);
    setPhoneMsg('');
    try {
      const res = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp: phoneOtp }),
      });
      const json = await res.json();
      if (json.ok) {
        setUser((u) => u ? { ...u, phoneVerified: true } : u);
        setPhoneMsg('شماره تلفن تأیید شد!');
      } else setPhoneMsg(json.error?.message ?? 'کد نادرست است');
    } finally {
      setPhoneSending(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">در حال بارگذاری…</div>;
  if (!user) return <div className="p-8 text-center">لطفاً وارد شوید.</div>;

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6" dir="rtl">
      <header className="flex items-center gap-3">
        <Shield className="h-7 w-7 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">امنیت حساب</h1>
          <p className="text-sm text-muted-foreground">مدیریت تأیید ایمیل و شماره تلفن</p>
        </div>
      </header>

      {/* Email Verification */}
      {user.email && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Mail className="h-5 w-5" />
              تأیید ایمیل
            </CardTitle>
            <CardDescription>{user.email}</CardDescription>
          </CardHeader>
          <CardContent>
            {user.emailVerified ? (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">ایمیل تأیید شده است</span>
              </div>
            ) : emailSent ? (
              <p className="text-sm text-muted-foreground">ایمیل تأیید ارسال شد. لطفاً صندوق ورودی خود را بررسی کنید.</p>
            ) : (
              <Button variant="outline" size="sm" onClick={sendEmailVerification} disabled={emailSending}>
                {emailSending ? 'در حال ارسال…' : 'ارسال ایمیل تأیید'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Phone Verification */}
      {user.phone && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Phone className="h-5 w-5" />
              تأیید شماره تلفن
            </CardTitle>
            <CardDescription>{user.phone}</CardDescription>
          </CardHeader>
          <CardContent>
            {user.phoneVerified ? (
              <div className="flex items-center gap-2 text-emerald-600">
                <CheckCircle className="h-5 w-5" />
                <span className="text-sm font-medium">شماره تلفن تأیید شده است</span>
              </div>
            ) : (
              <div className="space-y-3">
                {phoneStep === 'send' ? (
                  <Button variant="outline" size="sm" onClick={sendPhoneOtp} disabled={phoneSending}>
                    {phoneSending ? 'در حال ارسال…' : 'ارسال کد تأیید'}
                  </Button>
                ) : (
                  <div className="flex items-end gap-2">
                    <div className="flex-1 space-y-1">
                      <Label htmlFor="phoneOtp">کد تأیید</Label>
                      <Input id="phoneOtp" type="text" inputMode="numeric" maxLength={6} value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value)} placeholder="۰۰۰۰۰۰" dir="ltr" />
                    </div>
                    <Button size="sm" onClick={verifyPhone} disabled={phoneSending}>تأیید</Button>
                  </div>
                )}
                {phoneMsg && <p className="text-sm text-muted-foreground">{phoneMsg}</p>}
              </div>
            )}
          </CardContent>
        </Card>
      )}

    </div>
  );
}

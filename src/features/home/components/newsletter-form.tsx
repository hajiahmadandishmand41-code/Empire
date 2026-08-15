'use client';

import { useState } from 'react';
import { toast } from 'sonner';

export function NewsletterForm() {
  const [email, setEmail] = useState('');

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!email.trim()) return;
    toast.success('ایمیل شما با موفقیت ثبت شد');
    setEmail('');
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex gap-1.5"
      role="search"
      aria-label="عضویت در خبرنامه"
    >
      <label htmlFor="footer-email" className="sr-only">آدرس ایمیل</label>
      <input
        id="footer-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="example@email.com"
        dir="ltr"
        autoComplete="email"
        required
        className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors"
      />
      <button
        type="submit"
        className="rounded-lg bg-gradient-to-br from-rose-500 to-rose-600 px-3 py-2 text-[11px] font-bold text-white hover:from-rose-600 hover:to-rose-700 transition-all shadow-sm whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        ثبت
      </button>
    </form>
  );
}
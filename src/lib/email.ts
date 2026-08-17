/** Production email delivery for Empire Shop. */
import { logger } from '@/lib/logger';
import { SUPPORT_EMAIL } from '@/config/site';
import { resolveAppUrl } from '@/lib/email-url-helper';

export { SUPPORT_EMAIL };

type Locale = 'fa' | 'en' | 'ps';

interface EmailOptions { to: string; subject: string; html: string; text?: string }

function normalizeLocale(locale: string): Locale { return locale === 'en' || locale === 'ps' ? locale : 'fa'; }

function requireSmtp(): void {
  if (!process.env.SMTP_HOST?.trim() || !process.env.SMTP_USER?.trim() || !process.env.SMTP_PASS?.trim()) {
    throw new Error('SMTP email delivery is not configured');
  }
}

export async function sendEmail(opts: EmailOptions): Promise<void> {
  requireSmtp();
  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
    await transporter.sendMail({ from: process.env.SMTP_FROM ?? process.env.SMTP_USER, ...opts });
  } catch (error) {
    logger.error('email.send_failed', { to: opts.to, subject: opts.subject }, error);
    throw new Error('Email delivery failed');
  }
}

const COPY: Record<Locale, {
  reset: { subject: string; title: string; body: string; button: string; expiry: string };
  verify: { subject: string; title: string; body: string; button: string; expiry: string };
  welcome: { subject: (name: string) => string; title: (name: string) => string; body: string; button: string };
}> = {
  fa: {
    reset: { subject: 'امپایر شاپ — بازیابی رمز عبور', title: 'بازیابی رمز عبور', body: 'برای تنظیم رمز عبور جدید روی دکمه زیر کلیک کنید.', button: 'بازیابی رمز عبور', expiry: 'این لینک ۳۰ دقیقه اعتبار دارد.' },
    verify: { subject: 'امپایر شاپ — تأیید ایمیل', title: 'تأیید آدرس ایمیل', body: 'برای فعال‌سازی حساب خود روی دکمه زیر کلیک کنید.', button: 'تأیید ایمیل', expiry: 'این لینک ۲۴ ساعت اعتبار دارد.' },
    welcome: { subject: (name) => `به امپایر شاپ خوش آمدید، ${name}!`, title: (name) => `خوش آمدید، ${name}!`, body: 'حساب کاربری شما با موفقیت ایجاد شد.', button: 'شروع خرید' },
  },
  en: {
    reset: { subject: 'Empire Shop — Reset your password', title: 'Password reset', body: 'Click the button below to set a new password.', button: 'Reset password', expiry: 'This link expires in 30 minutes.' },
    verify: { subject: 'Empire Shop — Verify your email', title: 'Verify your email address', body: 'Click the button below to activate your account.', button: 'Verify email', expiry: 'This link expires in 24 hours.' },
    welcome: { subject: (name) => `Welcome to Empire Shop, ${name}!`, title: (name) => `Welcome, ${name}!`, body: 'Your account has been created successfully.', button: 'Start shopping' },
  },
  ps: {
    reset: { subject: 'امپایر شاپ — د پاسورډ بیا تنظیم', title: 'د پاسورډ بیا تنظیم', body: 'د نوي پاسورډ ټاکلو لپاره لاندې تڼۍ کېکاږئ.', button: 'پاسورډ بیا تنظیم کړئ', expiry: 'دا لینک د ۳۰ دقیقو لپاره معتبر دی.' },
    verify: { subject: 'امپایر شاپ — د بریښنالیک تایید', title: 'د بریښنالیک پته تایید کړئ', body: 'د خپل حساب فعالولو لپاره لاندې تڼۍ کېکاږئ.', button: 'بریښنالیک تایید کړئ', expiry: 'دا لینک د ۲۴ ساعتو لپاره معتبر دی.' },
    welcome: { subject: (name) => `امپایر شاپ ته ښه راغلاست، ${name}!`, title: (name) => `ښه راغلاست، ${name}!`, body: 'ستاسو حساب په بریالیتوب جوړ شو.', button: 'پیرود پیل کړئ' },
  },
};

function layout(locale: Locale, title: string, body: string): string {
  const dir = locale === 'en' ? 'ltr' : 'rtl';
  const brand = locale === 'en' ? 'Empire Shop' : 'امپایر شاپ';
  const tagline = locale === 'en' ? "Afghanistan's online store" : locale === 'ps' ? 'د افغانستان آنلاین پلورنځی' : 'فروشگاه اینترنتی افغانستان';
  return `<!doctype html><html lang="${locale}" dir="${dir}"><body style="font-family:Arial,sans-serif;background:#f8fafc;padding:24px"><table role="presentation" width="100%"><tr><td align="center"><table role="presentation" width="600" style="max-width:600px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden"><tr><td style="background:#e01850;color:#fff;padding:24px;text-align:center"><strong style="font-size:22px">${brand}</strong><div style="margin-top:6px;opacity:.85;font-size:13px">${tagline}</div></td></tr><tr><td dir="${dir}" style="padding:32px">${body}</td></tr><tr><td style="padding:16px;text-align:center;font-size:12px;color:#64748b">© ${new Date().getFullYear()} ${brand} · ${locale === 'en' ? 'Support' : locale === 'ps' ? 'ملاتړ' : 'پشتیبانی'}: ${SUPPORT_EMAIL}</td></tr></table></td></tr></table></body></html>`;
}

function button(href: string, label: string): string { return `<p style="text-align:center;margin:24px 0"><a href="${href}" style="display:inline-block;background:#e01850;color:#fff;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700">${label}</a></p>`; }

const SITE = resolveAppUrl();

export async function sendPasswordResetEmail(to: string, token: string, locale = 'fa'): Promise<void> {
  const loc = normalizeLocale(locale); const copy = COPY[loc].reset;
  const link = `${SITE}/${loc}/auth/reset-password?token=${encodeURIComponent(token)}`;
  const body = `<h2>${copy.title}</h2><p>${copy.body}</p>${button(link, copy.button)}<p style="color:#64748b;font-size:13px">${copy.expiry}</p><p style="font-size:12px;word-break:break-all">${link}</p>`;
  await sendEmail({ to, subject: copy.subject, html: layout(loc, copy.title, body), text: `${copy.body}\n${link}\n${copy.expiry}` });
}

export async function sendEmailVerificationEmail(to: string, token: string, locale = 'fa'): Promise<void> {
  const loc = normalizeLocale(locale); const copy = COPY[loc].verify;
  const link = `${SITE}/${loc}/auth/verify-email?token=${encodeURIComponent(token)}`;
  const body = `<h2>${copy.title}</h2><p>${copy.body}</p>${button(link, copy.button)}<p style="color:#64748b;font-size:13px">${copy.expiry}</p><p style="font-size:12px;word-break:break-all">${link}</p>`;
  await sendEmail({ to, subject: copy.subject, html: layout(loc, copy.title, body), text: `${copy.body}\n${link}\n${copy.expiry}` });
}

export async function sendWelcomeEmail(to: string, fullName: string, locale = 'fa'): Promise<void> {
  const loc = normalizeLocale(locale); const copy = COPY[loc].welcome;
  const shopUrl = `${SITE}/${loc}/shop`;
  const body = `<h2>${copy.title(fullName)}</h2><p>${copy.body}</p>${button(shopUrl, copy.button)}`;
  await sendEmail({ to, subject: copy.subject(fullName), html: layout(loc, copy.title(fullName), body), text: `${copy.title(fullName)}\n${copy.body}\n${shopUrl}` });
}

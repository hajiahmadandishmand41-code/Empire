/**
 * Email service with locale-aware templates.
 *
 * Supported locales: fa (Persian/Farsi, RTL), en (English, LTR), ps (Pashto, RTL).
 * Falls back to 'fa' for unknown locales.
 *
 * In production, configure SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS.
 * In development (or when SMTP is not configured), emails are logged to console.
 * Errors are always routed through the structured logger.
 */
import { logger } from '@/lib/logger';
import { SUPPORT_EMAIL } from '@/config/site';
import { resolveAppUrl } from '@/lib/email-url-helper';

export { SUPPORT_EMAIL };

// ─────────────────────────────────────────────
// Core sender
// ─────────────────────────────────────────────

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

const isSmtpConfigured =
  Boolean(process.env.SMTP_HOST) &&
  Boolean(process.env.SMTP_USER) &&
  Boolean(process.env.SMTP_PASS);

export async function sendEmail(opts: EmailOptions): Promise<void> {
  if (!isSmtpConfigured) {
    logger.info('email.dev_mode', {
      to: opts.to,
      subject: opts.subject,
      preview: opts.text ?? opts.html.replace(/<[^>]+>/g, '').slice(0, 120),
    });
    return;
  }

  try {
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
      ...opts,
    });
  } catch (err) {
    logger.error('email.send_failed', { to: opts.to, subject: opts.subject }, err);
    throw new Error('Email delivery failed');
  }
}

// ─────────────────────────────────────────────
// Locale configuration
// ─────────────────────────────────────────────

type SupportedLocale = 'fa' | 'en' | 'ps';

function normalizeLocale(locale: string): SupportedLocale {
  if (locale === 'en') return 'en';
  if (locale === 'ps') return 'ps';
  return 'fa'; // default
}

/** Text direction for each locale */
const DIRECTION: Record<SupportedLocale, 'rtl' | 'ltr'> = {
  fa: 'rtl',
  en: 'ltr',
  ps: 'rtl',
};

/** Display name of the shop per locale */
const SHOP_NAMES: Record<SupportedLocale, string> = {
  fa: 'امپایر شاپ',
  en: 'Empire Shop',
  ps: 'امپایر شاپ',
};

/** Taglines per locale */
const TAGLINES: Record<SupportedLocale, string> = {
  fa: 'فروشگاه اینترنتی افغانستان',
  en: 'Afghanistan\'s Online Store',
  ps: 'د افغانستان آنلاین پلورنځی',
};

/** Footer copyright per locale */
function footerText(locale: SupportedLocale, year: number): string {
  const shop = SHOP_NAMES[locale];
  const supportLabel = { fa: 'پشتیبانی', en: 'Support', ps: 'ملاتړ' }[locale];
  return `© ${year} ${shop} &nbsp;|&nbsp; ${supportLabel}: ${SUPPORT_EMAIL}`;
}

// ─────────────────────────────────────────────
// Shared HTML builder
// ─────────────────────────────────────────────

const SITE = resolveAppUrl();
const APP_NAME = 'Empire Shop';
const YEAR = new Date().getFullYear();

function buildEmailHtml(opts: {
  locale: SupportedLocale;
  title: string;
  bodyHtml: string;
}): string {
  const { locale, title, bodyHtml } = opts;
  const dir = DIRECTION[locale];
  const tagAlign = dir === 'rtl' ? 'right' : 'left';

  return `<!DOCTYPE html>
<html lang="${locale}" dir="${dir}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'Segoe UI',Tahoma,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:24px 0;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0"
               style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#be1a56 0%,#e01850 100%);padding:24px 32px;text-align:center;">
              <p style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:-0.5px;">
                ⚡ ${SHOP_NAMES[locale]}
              </p>
              <p style="margin:4px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">
                ${TAGLINES[locale]}
              </p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;direction:${dir};text-align:${tagAlign};">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background:#f8fafc;padding:16px 32px;text-align:center;font-size:12px;color:#64748b;direction:${dir};">
              <p style="margin:0;">${footerText(locale, YEAR)}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function primaryButton(href: string, label: string): string {
  return `<div style="text-align:center;margin:24px 0;">
    <a href="${href}"
       style="display:inline-block;background:#e01850;color:#ffffff;padding:13px 30px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px;">
      ${label}
    </a>
  </div>`;
}

// ─────────────────────────────────────────────
// Password reset
// ─────────────────────────────────────────────

const RESET_COPY: Record<SupportedLocale, {
  subject: string; heading: string; intro: string; btn: string; expiry: string; fallback: string; text: string;
}> = {
  fa: {
    subject: `${APP_NAME} — بازیابی رمز عبور`,
    heading: 'بازیابی رمز عبور',
    intro: 'درخواست بازیابی رمز عبور برای حساب کاربری شما دریافت شد. برای تنظیم رمز عبور جدید روی دکمه زیر کلیک کنید:',
    btn: 'بازیابی رمز عبور',
    expiry: 'این لینک ۱ ساعت اعتبار دارد. اگر این درخواست را شما ارسال نکرده‌اید، این ایمیل را نادیده بگیرید.',
    fallback: 'اگر دکمه کار نمی‌کند، لینک زیر را در مرورگر باز کنید:',
    text: 'برای بازیابی رمز عبور به آدرس زیر مراجعه کنید:\n{link}\n\nاین لینک ۱ ساعت اعتبار دارد.',
  },
  en: {
    subject: `${APP_NAME} — Reset Your Password`,
    heading: 'Password Reset Request',
    intro: 'We received a request to reset the password for your account. Click the button below to set a new password:',
    btn: 'Reset Password',
    expiry: 'This link expires in 1 hour. If you did not request a password reset, please ignore this email.',
    fallback: 'If the button does not work, copy and paste this link into your browser:',
    text: 'Reset your password by visiting:\n{link}\n\nThis link expires in 1 hour.',
  },
  ps: {
    subject: `${APP_NAME} — د پاسورډ بیرته ترلاسه کول`,
    heading: 'د پاسورډ بیرته ترلاسه کول',
    intro: 'ستاسو د حساب د پاسورډ د بیرته ترلاسه کولو غوښتنه ترلاسه شوه. د نوي پاسورډ ټاکلو لپاره لاندې تڼۍ فشار ورکړئ:',
    btn: 'پاسورډ بیرته ترلاسه کول',
    expiry: 'دا لینک د ۱ ساعت لپاره معتبر دی. که تاسو دا غوښتنه نه وه کړې، دا بریښنالیک له پامه غورځولی شئ.',
    fallback: 'که تڼۍ کار ونه کړه، لاندې لینک خپل براوزر کې کاپي کړئ:',
    text: 'د پاسورډ بیرته ترلاسه کولو لپاره لاندې لینک ته لاړ شئ:\n{link}\n\nدا لینک د ۱ ساعت لپاره معتبر دی.',
  },
};

export async function sendPasswordResetEmail(
  to: string,
  token: string,
  locale = 'fa',
): Promise<void> {
  const loc = normalizeLocale(locale);
  const copy = RESET_COPY[loc];
  const link = `${SITE}/${locale}/auth/reset-password?token=${token}`;

  const bodyHtml = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1e293b;">${copy.heading}</h2>
    <p style="color:#475569;line-height:1.75;margin:0 0 24px;">${copy.intro}</p>
    ${primaryButton(link, copy.btn)}
    <p style="color:#94a3b8;font-size:13px;margin:16px 0 8px;">${copy.expiry}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">${copy.fallback}</p>
    <p style="color:#94a3b8;font-size:11px;word-break:break-all;margin:0;">${link}</p>`;

  await sendEmail({
    to,
    subject: copy.subject,
    html: buildEmailHtml({ locale: loc, title: copy.heading, bodyHtml }),
    text: copy.text.replace('{link}', link),
  });
}

// ─────────────────────────────────────────────
// Email verification
// ─────────────────────────────────────────────

const VERIFY_COPY: Record<SupportedLocale, {
  subject: string; heading: string; intro: string; btn: string; expiry: string; fallback: string; text: string;
}> = {
  fa: {
    subject: `${APP_NAME} — تأیید آدرس ایمیل`,
    heading: 'تأیید آدرس ایمیل',
    intro: 'برای تکمیل ثبت‌نام و فعال‌سازی حساب کاربری خود، روی دکمه زیر کلیک کنید:',
    btn: 'تأیید ایمیل',
    expiry: 'این لینک ۲۴ ساعت اعتبار دارد.',
    fallback: 'اگر دکمه کار نمی‌کند، لینک زیر را در مرورگر باز کنید:',
    text: 'برای تأیید ایمیل به آدرس زیر مراجعه کنید:\n{link}\n\nاین لینک ۲۴ ساعت اعتبار دارد.',
  },
  en: {
    subject: `${APP_NAME} — Verify Your Email Address`,
    heading: 'Verify Your Email Address',
    intro: 'To complete your registration and activate your account, click the button below:',
    btn: 'Verify Email',
    expiry: 'This link expires in 24 hours.',
    fallback: 'If the button does not work, copy and paste this link into your browser:',
    text: 'Verify your email by visiting:\n{link}\n\nThis link expires in 24 hours.',
  },
  ps: {
    subject: `${APP_NAME} — د بریښنالیک پتې تایید`,
    heading: 'د بریښنالیک پتې تایید',
    intro: 'د خپل ثبت نام بشپړولو او حساب فعالولو لپاره، لاندې تڼۍ فشار ورکړئ:',
    btn: 'بریښنالیک تایید کړئ',
    expiry: 'دا لینک د ۲۴ ساعتو لپاره معتبر دی.',
    fallback: 'که تڼۍ کار ونه کړه، لاندې لینک خپل براوزر کې کاپي کړئ:',
    text: 'د بریښنالیک تایید لپاره لاندې لینک ته لاړ شئ:\n{link}\n\nدا لینک د ۲۴ ساعتو لپاره معتبر دی.',
  },
};

export async function sendEmailVerificationEmail(
  to: string,
  token: string,
  locale = 'fa',
): Promise<void> {
  const loc = normalizeLocale(locale);
  const copy = VERIFY_COPY[loc];
  const link = `${SITE}/${locale}/auth/verify-email?token=${token}`;

  const bodyHtml = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1e293b;">${copy.heading}</h2>
    <p style="color:#475569;line-height:1.75;margin:0 0 24px;">${copy.intro}</p>
    ${primaryButton(link, copy.btn)}
    <p style="color:#94a3b8;font-size:13px;margin:16px 0 8px;">${copy.expiry}</p>
    <hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;" />
    <p style="color:#94a3b8;font-size:12px;margin:0 0 4px;">${copy.fallback}</p>
    <p style="color:#94a3b8;font-size:11px;word-break:break-all;margin:0;">${link}</p>`;

  await sendEmail({
    to,
    subject: copy.subject,
    html: buildEmailHtml({ locale: loc, title: copy.heading, bodyHtml }),
    text: copy.text.replace('{link}', link),
  });
}

// ─────────────────────────────────────────────
// Welcome email
// ─────────────────────────────────────────────

const WELCOME_COPY: Record<SupportedLocale, {
  subject: (name: string) => string;
  heading: (name: string) => string;
  body: string;
  btn: string;
  text: (name: string, shopUrl: string) => string;
}> = {
  fa: {
    subject: (name) => `خوش آمدید به ${APP_NAME}، ${name}!`,
    heading: (name) => `خوش آمدید، ${name}!`,
    body: 'حساب کاربری شما با موفقیت ایجاد شد. اکنون می‌توانید از هزاران محصول اصل خریداری کنید.',
    btn: 'شروع خرید',
    text: (name, url) => `خوش آمدید به ${APP_NAME}، ${name}!\n\nشروع خرید: ${url}`,
  },
  en: {
    subject: (name) => `Welcome to ${APP_NAME}, ${name}!`,
    heading: (name) => `Welcome, ${name}!`,
    body: 'Your account has been created successfully. You can now shop from thousands of authentic products.',
    btn: 'Start Shopping',
    text: (name, url) => `Welcome to ${APP_NAME}, ${name}!\n\nStart shopping: ${url}`,
  },
  ps: {
    subject: (name) => `${APP_NAME} ته ښه راغلاست، ${name}!`,
    heading: (name) => `ښه راغلاست، ${name}!`,
    body: 'ستاسو حساب بریالیتوب سره جوړ شو. اوس تاسو کولی شئ له زرګونو اصلي توکو څخه پیرود وکړئ.',
    btn: 'پیرود پیل کړئ',
    text: (name, url) => `${APP_NAME} ته ښه راغلاست، ${name}!\n\nپیرود پیل کړئ: ${url}`,
  },
};

export async function sendWelcomeEmail(
  to: string,
  fullName: string,
  locale = 'fa',
): Promise<void> {
  const loc = normalizeLocale(locale);
  const copy = WELCOME_COPY[loc];
  const shopUrl = `${SITE}/${locale}/shop`;

  const bodyHtml = `
    <h2 style="margin:0 0 16px;font-size:20px;font-weight:700;color:#1e293b;">${copy.heading(fullName)}</h2>
    <p style="color:#475569;line-height:1.75;margin:0 0 24px;">${copy.body}</p>
    ${primaryButton(shopUrl, copy.btn)}`;

  await sendEmail({
    to,
    subject: copy.subject(fullName),
    html: buildEmailHtml({ locale: loc, title: copy.heading(fullName), bodyHtml }),
    text: copy.text(fullName, shopUrl),
  });
}

import { logger } from '@/lib/logger';

const APP_NAME = 'Empire Shop';

const smtpConfigured = Boolean(
  process.env.SMTP_HOST?.trim() &&
  process.env.SMTP_USER?.trim() &&
  process.env.SMTP_PASS?.trim(),
);
const twilioConfigured = Boolean(
  process.env.SMS_PROVIDER === 'twilio' &&
  process.env.TWILIO_ACCOUNT_SID?.trim() &&
  process.env.TWILIO_AUTH_TOKEN?.trim() &&
  process.env.TWILIO_PHONE?.trim(),
);

function assertConfigured(): void {
  const missing: string[] = [];
  if (!smtpConfigured) missing.push('SMTP_HOST/SMTP_USER/SMTP_PASS');
  if (!twilioConfigured) missing.push('SMS_PROVIDER=twilio + Twilio credentials');
  if (missing.length) {
    throw new Error(`OTP delivery is not configured: ${missing.join(', ')}`);
  }
}

async function sendEmailOtp(to: string, otp: string): Promise<void> {
  if (!smtpConfigured) throw new Error('SMTP is not configured');

  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT ?? 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });

  const subject = `${APP_NAME} — verification code`;
  const text = `${APP_NAME}: Your verification code is ${otp}. It expires in 10 minutes. Do not share this code.`;
  const html = `<!doctype html><html dir="ltr"><body style="font-family:Arial,sans-serif"><h2>${APP_NAME}</h2><p>Your verification code:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px">${otp}</div><p>This code expires in 10 minutes.</p><p>Do not share this code with anyone.</p></body></html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}

async function sendSmsOtp(to: string, otp: string): Promise<void> {
  if (!twilioConfigured) throw new Error('Twilio is not configured');

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const auth = Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN!}`).toString('base64');
  const body = new URLSearchParams({
    From: process.env.TWILIO_PHONE!,
    To: to,
    Body: `${APP_NAME}: Your verification code is ${otp}. It expires in 10 minutes.`,
  });

  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
    {
      method: 'POST',
      headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      cache: 'no-store',
    },
  );
  if (!response.ok) throw new Error(`Twilio delivery failed (${response.status})`);
}

export interface OtpDeliveryResult { email: boolean; sms: boolean; }

/** Send the exact same OTP to every configured contact channel. */
export async function sendOtpToEmailAndPhone(
  otp: string,
  channels: { email?: string | null; phone?: string | null },
): Promise<OtpDeliveryResult> {
  assertConfigured();

  const email = channels.email?.trim() || null;
  const phone = channels.phone?.trim() || null;
  if (!email && !phone) throw new Error('No OTP delivery channel is available');

  const tasks: Array<Promise<void>> = [];
  const labels: Array<'email' | 'sms'> = [];
  if (email) { labels.push('email'); tasks.push(sendEmailOtp(email, otp)); }
  if (phone) { labels.push('sms'); tasks.push(sendSmsOtp(phone, otp)); }

  const results = await Promise.allSettled(tasks);
  const delivery: OtpDeliveryResult = { email: false, sms: false };
  const failures: string[] = [];
  results.forEach((result, index) => {
    const label = labels[index];
    if (result.status === 'fulfilled') delivery[label] = true;
    else failures.push(label);
  });

  if (failures.length) {
    logger.warn('auth.otp_delivery.partial_failure', { channels: failures });
    throw new Error(`OTP delivery failed for: ${failures.join(', ')}`);
  }
  return delivery;
}

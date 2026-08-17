import { logger } from '@/lib/logger';

const APP_NAME = 'Empire Shop';

const isProduction = process.env.NODE_ENV === 'production';
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
  if (missing.length && isProduction) {
    throw new Error(`OTP delivery is not configured: ${missing.join(', ')}`);
  }
}

async function sendEmailOtp(to: string, otp: string): Promise<void> {
  if (!smtpConfigured) {
    logger.info('auth.otp.email_dev_mode', { to });
    return;
  }

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

  const subject = `${APP_NAME} — کد تأیید`;
  const text = `${APP_NAME}: کد تأیید شما ${otp} است. این کد ۱۰ دقیقه اعتبار دارد. کد را با دیگران به اشتراک نگذارید.`;
  const html = `<!doctype html><html><body style="font-family:Arial,sans-serif"><h2>${APP_NAME}</h2><p>کد تأیید شما:</p><div style="font-size:32px;font-weight:700;letter-spacing:8px">${otp}</div><p>این کد ۱۰ دقیقه اعتبار دارد.</p><p>کد را با دیگران به اشتراک نگذارید.</p></body></html>`;

  await transporter.sendMail({
    from: process.env.SMTP_FROM ?? process.env.SMTP_USER,
    to,
    subject,
    text,
    html,
  });
}

async function sendSmsOtp(to: string, otp: string): Promise<void> {
  if (!twilioConfigured) {
    logger.info('auth.otp.sms_dev_mode', { to });
    return;
  }

  const { default: twilio } = await import('twilio');
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  await client.messages.create({
    from: process.env.TWILIO_PHONE!,
    to,
    body: `${APP_NAME}: کد تأیید شما ${otp} است. این کد ۱۰ دقیقه اعتبار دارد.`,
  });
}

export interface OtpDeliveryResult {
  email: boolean;
  sms: boolean;
}

/** Send the same OTP to every available verified delivery channel. */
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

  if (email) {
    labels.push('email');
    tasks.push(sendEmailOtp(email, otp));
  }
  if (phone) {
    labels.push('sms');
    tasks.push(sendSmsOtp(phone, otp));
  }

  const results = await Promise.allSettled(tasks);
  const delivery: OtpDeliveryResult = { email: false, sms: false };
  const failures: string[] = [];

  results.forEach((result, index) => {
    const label = labels[index];
    if (result.status === 'fulfilled') delivery[label] = true;
    else failures.push(label);
  });

  if (failures.length > 0) {
    throw new Error(`OTP delivery failed for: ${failures.join(', ')}`);
  }

  return delivery;
}

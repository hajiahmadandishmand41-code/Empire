/** SMS delivery through Twilio's REST API. */
import { logger } from '@/lib/logger';

interface SmsOptions { to: string; body: string; }

const isProduction = process.env.NODE_ENV === 'production';
const isTwilioConfigured =
  process.env.SMS_PROVIDER === 'twilio' &&
  Boolean(process.env.TWILIO_ACCOUNT_SID?.trim()) &&
  Boolean(process.env.TWILIO_AUTH_TOKEN?.trim()) &&
  Boolean(process.env.TWILIO_PHONE?.trim());

export async function sendSms(opts: SmsOptions): Promise<void> {
  if (!isTwilioConfigured) {
    if (isProduction) throw new Error('SMS delivery is not configured');
    logger.info('sms.dev_mode', { to: opts.to });
    return;
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID!;
  const auth = Buffer.from(`${accountSid}:${process.env.TWILIO_AUTH_TOKEN!}`).toString('base64');
  const body = new URLSearchParams({ From: process.env.TWILIO_PHONE!, To: opts.to, Body: opts.body });
  try {
    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(accountSid)}/Messages.json`,
      {
        method: 'POST',
        headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
        cache: 'no-store',
      },
    );
    if (!response.ok) throw new Error(`SMS delivery failed (${response.status})`);
  } catch (err) {
    logger.error('sms.send_failed', { to: opts.to }, err);
    throw new Error('SMS delivery failed');
  }
}

const APP_NAME = 'Empire Shop';

export async function sendPhoneOtp(phone: string, otp: string): Promise<void> {
  await sendSms({ to: phone, body: `${APP_NAME}: کد تأیید شما ${otp} است. این کد ۱۰ دقیقه اعتبار دارد.` });
}

export async function sendOtpLogin(phone: string, otp: string): Promise<void> {
  await sendSms({ to: phone, body: `${APP_NAME}: کد ورود شما ${otp} است. این کد ۱۰ دقیقه اعتبار دارد.` });
}

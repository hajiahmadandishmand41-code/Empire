/**
 * SMS service.
 *
 * Set SMS_PROVIDER=twilio and TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE
 * for real delivery. Otherwise OTPs are logged via the structured logger (dev mode).
 *
 * Stage 3: replaced console.info/console.error with structured logger.
 */
import { logger } from '@/lib/logger';

interface SmsOptions {
  to: string;
  body: string;
}

const isTwilioConfigured =
  process.env.SMS_PROVIDER === 'twilio' &&
  Boolean(process.env.TWILIO_ACCOUNT_SID) &&
  Boolean(process.env.TWILIO_AUTH_TOKEN) &&
  Boolean(process.env.TWILIO_PHONE);

export async function sendSms(opts: SmsOptions): Promise<void> {
  if (!isTwilioConfigured) {
    // Dev mode: log via structured logger (no real delivery).
    logger.info('sms.dev_mode', { to: opts.to, preview: opts.body.slice(0, 60) });
    return;
  }

  try {
    const { default: twilio } = await import('twilio');
    const client = twilio(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!,
    );
    await client.messages.create({
      from: process.env.TWILIO_PHONE!,
      to: opts.to,
      body: opts.body,
    });
  } catch (err) {
    logger.error('sms.send_failed', { to: opts.to }, err);
    throw new Error('SMS delivery failed');
  }
}

const APP_NAME = 'Empire Shop';

export async function sendPhoneOtp(phone: string, otp: string): Promise<void> {
  await sendSms({
    to: phone,
    body: `${APP_NAME}: کد تأیید شما ${otp} است. این کد ۱۰ دقیقه اعتبار دارد.`,
  });
}

export async function sendOtpLogin(phone: string, otp: string): Promise<void> {
  await sendSms({
    to: phone,
    body: `${APP_NAME}: کد ورود شما ${otp} است. این کد ۱۰ دقیقه اعتبار دارد.`,
  });
}

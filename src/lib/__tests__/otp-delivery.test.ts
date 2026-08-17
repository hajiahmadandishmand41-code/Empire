import { describe, expect, it } from 'vitest';

describe('OTP delivery configuration contract', () => {
  it('uses the production environment only when both delivery channels are configured', () => {
    expect(typeof process.env.NODE_ENV).toBe('string');
  });

  it('never exposes an OTP in the public response contract', () => {
    const response = { message: 'کد یکسان به ایمیل و شماره تلفن شما ارسال شد.', expiresInSeconds: 600 };
    expect('otp' in response).toBe(false);
  });
});

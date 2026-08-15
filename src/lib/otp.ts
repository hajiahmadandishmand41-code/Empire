import { randomInt, randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import type { VerificationTokenType } from '@prisma/client';

/** Generate a numeric OTP of given length */
export function generateNumericOtp(length = 6): string {
  const max = Math.pow(10, length);
  const code = randomInt(0, max);
  return code.toString().padStart(length, '0');
}

/** Generate a secure random hex token */
export function generateHexToken(bytes = 32): string {

  return randomBytes(bytes).toString('hex');
}

/** Create and store a verification token in DB */
export async function createVerificationToken(
  userId: string,
  type: VerificationTokenType,
  ttlMinutes = 30,
): Promise<string> {
  // Invalidate any existing tokens of the same type for the user
  await prisma.verificationToken.deleteMany({ where: { userId, type } });

  const isOtp = type === 'phone_otp' || type === 'otp_login';
  const token = isOtp ? generateNumericOtp(6) : generateHexToken(32);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await prisma.verificationToken.create({
    data: { userId, token, type, expiresAt },
  });

  return token;
}

/** Verify a token — returns userId on success, null on failure */
export async function consumeVerificationToken(
  token: string,
  type: VerificationTokenType,
): Promise<string | null> {
  const record = await prisma.verificationToken.findFirst({
    where: { token, type, usedAt: null },
  });
  if (!record) return null;
  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.delete({ where: { id: record.id } });
    return null;
  }
  await prisma.verificationToken.update({
    where: { id: record.id },
    data: { usedAt: new Date() },
  });
  return record.userId;
}

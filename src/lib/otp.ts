import { createHash, randomInt, randomBytes } from 'crypto';
import { prisma } from '@/lib/db';
import type { VerificationTokenType } from '@prisma/client';

/** Generate a numeric OTP of given length using cryptographically secure randomness. */
export function generateNumericOtp(length = 6): string {
  const max = Math.pow(10, length);
  const code = randomInt(0, max);
  return code.toString().padStart(length, '0');
}

/** Generate a secure random hex token. */
export function generateHexToken(bytes = 32): string {
  return randomBytes(bytes).toString('hex');
}

function isOtpType(type: VerificationTokenType): boolean {
  return type === 'phone_otp' || type === 'otp_login';
}

function storageToken(token: string, type: VerificationTokenType): string {
  return isOtpType(type)
    ? createHash('sha256').update(token, 'utf8').digest('hex')
    : token;
}

/**
 * Create and store a verification token in DB.
 * OTP values are returned only to the delivery provider and are stored as
 * SHA-256 digests so a database read cannot reveal usable OTPs.
 */
export async function createVerificationToken(
  userId: string,
  type: VerificationTokenType,
  ttlMinutes = 30,
): Promise<string> {
  await prisma.verificationToken.deleteMany({ where: { userId, type } });

  const token = isOtpType(type) ? generateNumericOtp(6) : generateHexToken(32);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      userId,
      token: storageToken(token, type),
      type,
      expiresAt,
    },
  });

  return token;
}

/**
 * Verify and consume a token exactly once.
 * The final update is conditional on `usedAt IS NULL`, so concurrent
 * verification attempts cannot both successfully consume the same OTP.
 */
export async function consumeVerificationToken(
  token: string,
  type: VerificationTokenType,
): Promise<string | null> {
  const storedToken = storageToken(token, type);
  const record = await prisma.verificationToken.findFirst({
    where: { token: storedToken, type, usedAt: null },
  });
  if (!record) return null;

  if (record.expiresAt < new Date()) {
    await prisma.verificationToken.deleteMany({ where: { id: record.id, usedAt: null } });
    return null;
  }

  const consumed = await prisma.verificationToken.updateMany({
    where: { id: record.id, usedAt: null },
    data: { usedAt: new Date() },
  });

  return consumed.count === 1 ? record.userId : null;
}

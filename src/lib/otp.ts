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

/**
 * All verification material is hashed before database storage. This prevents
 * a database reader from directly redeeming an outstanding reset/verification
 * token. Existing unhashed tokens are intentionally invalidated by this code
 * path and must be re-issued.
 */
function storageToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Create and store a verification token in DB. */
export async function createVerificationToken(
  userId: string,
  type: VerificationTokenType,
  ttlMinutes = 30,
): Promise<string> {
  await prisma.verificationToken.deleteMany({ where: { userId, type } });

  const token = type === 'phone_otp' || type === 'otp_login' ? generateNumericOtp(6) : generateHexToken(32);
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await prisma.verificationToken.create({
    data: {
      userId,
      token: storageToken(token),
      type,
      expiresAt,
    },
  });

  return token;
}

/** Verify and consume a token exactly once, optionally bound to a user. */
export async function consumeVerificationToken(
  token: string,
  type: VerificationTokenType,
  userId?: string,
): Promise<string | null> {
  const storedToken = storageToken(token);
  const record = await prisma.verificationToken.findFirst({
    where: {
      token: storedToken,
      type,
      usedAt: null,
      expiresAt: { gt: new Date() },
      ...(userId ? { userId } : {}),
    },
  });
  if (!record) return null;

  const consumed = await prisma.verificationToken.updateMany({
    where: {
      id: record.id,
      usedAt: null,
      expiresAt: { gt: new Date() },
      ...(userId ? { userId } : {}),
    },
    data: { usedAt: new Date() },
  });

  return consumed.count === 1 ? record.userId : null;
}

/**
 * Atomically consumes a password-reset token and changes the user's password.
 */
export async function consumePasswordResetAndUpdatePassword(
  token: string,
  passwordHash: string,
): Promise<string | null> {
  const storedToken = storageToken(token);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const record = await tx.verificationToken.findFirst({
      where: {
        token: storedToken,
        type: 'password_reset',
        usedAt: null,
        expiresAt: { gt: now },
      },
      select: { id: true, userId: true },
    });

    if (!record) return null;

    const consumed = await tx.verificationToken.updateMany({
      where: { id: record.id, usedAt: null, expiresAt: { gt: now } },
      data: { usedAt: now },
    });
    if (consumed.count !== 1) return null;

    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash, updatedAt: now },
    });

    return record.userId;
  });
}

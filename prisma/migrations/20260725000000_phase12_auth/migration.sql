-- Phase 12 — Auth enhancements: email/phone verification, 2FA, OTP

-- Add auth fields to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "phoneVerified" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;

-- Create VerificationTokenType enum
DO $$ BEGIN
  CREATE TYPE "VerificationTokenType" AS ENUM (
    'email_verification',
    'phone_otp',
    'password_reset',
    'otp_login',
    'two_factor_setup'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- Create VerificationToken table
CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "id"        TEXT        NOT NULL,
  "userId"    TEXT        NOT NULL,
  "token"     TEXT        NOT NULL,
  "type"      "VerificationTokenType" NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "usedAt"    TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "VerificationToken_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "VerificationToken_token_key" UNIQUE ("token"),
  CONSTRAINT "VerificationToken_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "VerificationToken_userId_idx"    ON "VerificationToken"("userId");
CREATE INDEX IF NOT EXISTS "VerificationToken_token_idx"     ON "VerificationToken"("token");
CREATE INDEX IF NOT EXISTS "VerificationToken_type_idx"      ON "VerificationToken"("type");
CREATE INDEX IF NOT EXISTS "VerificationToken_expiresAt_idx" ON "VerificationToken"("expiresAt");

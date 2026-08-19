CREATE TABLE IF NOT EXISTS "AdminNotification" (
  "id" TEXT NOT NULL,
  "audience" TEXT NOT NULL DEFAULT 'users',
  "title" TEXT NOT NULL,
  "body" TEXT,
  "href" TEXT,
  "kind" TEXT NOT NULL DEFAULT 'system',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sendAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminNotification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "AdminNotification_audience_active_sendAt_idx" ON "AdminNotification"("audience","isActive","sendAt");

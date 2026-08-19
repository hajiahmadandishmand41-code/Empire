-- Eshop Admin Center controls
-- Non-destructive: all tables are additive and independent from existing Prisma models.

CREATE TABLE IF NOT EXISTS "AdminAccessControl" (
  "userId" TEXT NOT NULL,
  "accessRole" TEXT NOT NULL DEFAULT 'admin',
  "permissionsJson" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AdminAccessControl_pkey" PRIMARY KEY ("userId")
);
CREATE INDEX IF NOT EXISTS "AdminAccessControl_accessRole_idx" ON "AdminAccessControl"("accessRole");

CREATE TABLE IF NOT EXISTS "HomepageSection" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "title" TEXT,
  "subtitle" TEXT,
  "type" TEXT NOT NULL DEFAULT 'products',
  "configJson" JSONB NOT NULL DEFAULT '{}'::jsonb,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "HomepageSection_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "HomepageSection_key_key" ON "HomepageSection"("key");
CREATE INDEX IF NOT EXISTS "HomepageSection_active_order_idx" ON "HomepageSection"("isActive","sortOrder");

CREATE TABLE IF NOT EXISTS "MediaAsset" (
  "id" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "kind" TEXT NOT NULL,
  "mimeType" TEXT,
  "fileName" TEXT,
  "sizeBytes" INTEGER,
  "width" INTEGER,
  "height" INTEGER,
  "altText" TEXT,
  "folder" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "MediaAsset_kind_createdAt_idx" ON "MediaAsset"("kind","createdAt");
CREATE INDEX IF NOT EXISTS "MediaAsset_folder_createdAt_idx" ON "MediaAsset"("folder","createdAt");

CREATE TABLE IF NOT EXISTS "SearchQueryStat" (
  "id" TEXT NOT NULL,
  "query" TEXT NOT NULL,
  "resultCount" INTEGER NOT NULL DEFAULT 0,
  "searchCount" INTEGER NOT NULL DEFAULT 1,
  "lastSearchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SearchQueryStat_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "SearchQueryStat_query_key" ON "SearchQueryStat"("query");
CREATE INDEX IF NOT EXISTS "SearchQueryStat_searchCount_idx" ON "SearchQueryStat"("searchCount");
CREATE INDEX IF NOT EXISTS "SearchQueryStat_resultCount_idx" ON "SearchQueryStat"("resultCount");

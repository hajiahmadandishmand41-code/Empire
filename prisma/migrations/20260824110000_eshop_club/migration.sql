CREATE TABLE IF NOT EXISTS "CommunityPost" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "parentId" TEXT,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CommunityPost_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CommunityPostLike" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CommunityPostLike_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CommunityPostLike_userId_postId_key" ON "CommunityPostLike"("userId", "postId");
CREATE INDEX IF NOT EXISTS "CommunityPost_userId_idx" ON "CommunityPost"("userId");
CREATE INDEX IF NOT EXISTS "CommunityPost_parentId_createdAt_idx" ON "CommunityPost"("parentId", "createdAt");
CREATE INDEX IF NOT EXISTS "CommunityPostLike_postId_idx" ON "CommunityPostLike"("postId");
CREATE INDEX IF NOT EXISTS "CommunityPostLike_userId_idx" ON "CommunityPostLike"("userId");

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CommunityPost_userId_fkey') THEN
    ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CommunityPost_parentId_fkey') THEN
    ALTER TABLE "CommunityPost" ADD CONSTRAINT "CommunityPost_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CommunityPostLike_userId_fkey') THEN
    ALTER TABLE "CommunityPostLike" ADD CONSTRAINT "CommunityPostLike_userId_fkey"
      FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'CommunityPostLike_postId_fkey') THEN
    ALTER TABLE "CommunityPostLike" ADD CONSTRAINT "CommunityPostLike_postId_fkey"
      FOREIGN KEY ("postId") REFERENCES "CommunityPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

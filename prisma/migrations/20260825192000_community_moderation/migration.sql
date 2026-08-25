-- Non-destructive moderation flags for community content.
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "isSpam" BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE "CommunityPost" ADD COLUMN IF NOT EXISTS "isDeleted" BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS "CommunityPost_moderation_createdAt_idx"
  ON "CommunityPost" ("isDeleted", "isHidden", "isSpam", "createdAt" DESC, "id" ASC);

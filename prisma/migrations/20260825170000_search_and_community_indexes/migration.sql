-- Search/Community performance indexes.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS "Product_name_trgm_idx"
  ON "Product" USING GIN ("name" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_shortDescription_trgm_idx"
  ON "Product" USING GIN ("shortDescription" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_description_trgm_idx"
  ON "Product" USING GIN ("description" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Product_region_trgm_idx"
  ON "Product" USING GIN ("region" gin_trgm_ops);

CREATE INDEX IF NOT EXISTS "CommunityPost_parent_createdAt_idx"
  ON "CommunityPost" ("parentId", "createdAt" DESC);
CREATE INDEX IF NOT EXISTS "CommunityPostLike_postId_idx"
  ON "CommunityPostLike" ("postId");
CREATE INDEX IF NOT EXISTS "CommunityPostLike_userId_postId_idx"
  ON "CommunityPostLike" ("userId", "postId");

CREATE TABLE "UserRecommendationProfile" (
  "userId" TEXT NOT NULL,
  "profileJson" JSONB NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT "UserRecommendationProfile_pkey" PRIMARY KEY ("userId"),
  CONSTRAINT "UserRecommendationProfile_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "UserRecommendationProfile_updatedAt_idx"
  ON "UserRecommendationProfile" ("updatedAt");

-- Empire Shop — Phase 5: Admin Panel
-- Adds seller approval workflow on User.

CREATE TYPE "SellerStatus" AS ENUM ('none', 'pending', 'approved', 'rejected');

ALTER TABLE "User" ADD COLUMN "sellerStatus" "SellerStatus" NOT NULL DEFAULT 'none';
ALTER TABLE "User" ADD COLUMN "sellerShopName" TEXT;
ALTER TABLE "User" ADD COLUMN "sellerBio" TEXT;

-- Existing sellers should be considered approved.
UPDATE "User" SET "sellerStatus" = 'approved' WHERE "role" = 'seller';

CREATE INDEX "User_sellerStatus_idx" ON "User"("sellerStatus");

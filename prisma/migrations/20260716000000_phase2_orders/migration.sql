-- Empire Shop — initial migration
-- Covers Phase 12.1 base schema + Phase 1 payments + Phase 2 orders (userId now
-- populated on Order/Address at creation time — no schema change vs. Phase 1).

-- Enums
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
CREATE TYPE "PaymentMethod" AS ENUM ('cod', 'bank_transfer', 'whatsapp', 'atoma_pay');
CREATE TYPE "PaymentStatus" AS ENUM ('pending', 'paid', 'failed', 'refunded', 'cancelled');
CREATE TYPE "Role" AS ENUM ('customer', 'seller', 'admin');

-- User
CREATE TABLE "User" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT,
  "phone" TEXT,
  "fullName" TEXT NOT NULL,
  "passwordHash" TEXT NOT NULL,
  "role" "Role" NOT NULL DEFAULT 'customer',
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");

-- Category
CREATE TABLE "Category" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "key" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL
);
CREATE UNIQUE INDEX "Category_key_key" ON "Category"("key");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- Product
CREATE TABLE "Product" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "description" TEXT,
  "price" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "badge" TEXT,
  "region" TEXT NOT NULL,
  "inStock" BOOLEAN NOT NULL DEFAULT true,
  "featuresJson" TEXT,
  "imagesJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "categoryId" TEXT NOT NULL,
  "sellerId" TEXT,
  CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT "Product_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_categoryId_idx" ON "Product"("categoryId");
CREATE INDEX "Product_sellerId_idx" ON "Product"("sellerId");

-- Address
CREATE TABLE "Address" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "fullName" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "province" TEXT NOT NULL,
  "district" TEXT NOT NULL,
  "addressLine" TEXT NOT NULL,
  "postalCode" TEXT,
  "notes" TEXT,
  CONSTRAINT "Address_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Order
CREATE TABLE "Order" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "reference" TEXT NOT NULL,
  "status" "OrderStatus" NOT NULL DEFAULT 'pending',
  "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'cod',
  "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'pending',
  "subtotal" DOUBLE PRECISION NOT NULL,
  "shipping" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "total" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "itemCount" INTEGER NOT NULL,
  "userId" TEXT,
  "addressId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Order_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Order_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Order_reference_key" ON "Order"("reference");
CREATE INDEX "Order_userId_idx" ON "Order"("userId");
CREATE INDEX "Order_addressId_idx" ON "Order"("addressId");
CREATE INDEX "Order_paymentStatus_idx" ON "Order"("paymentStatus");

-- OrderItem (product snapshot)
CREATE TABLE "OrderItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "quantity" INTEGER NOT NULL,
  CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

-- Cart / CartItem
CREATE TABLE "Cart" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Cart_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE TABLE "CartItem" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "cartId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "quantity" INTEGER NOT NULL DEFAULT 1,
  CONSTRAINT "CartItem_cartId_fkey" FOREIGN KEY ("cartId") REFERENCES "Cart"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CartItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CartItem_cartId_productId_key" ON "CartItem"("cartId", "productId");
CREATE INDEX "CartItem_cartId_idx" ON "CartItem"("cartId");

-- Transaction (Phase 1 payments)
CREATE TABLE "Transaction" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "orderId" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "method" "PaymentMethod" NOT NULL,
  "status" "PaymentStatus" NOT NULL DEFAULT 'pending',
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'USD',
  "providerTxnId" TEXT,
  "providerRaw" TEXT,
  "failureReason" TEXT,
  "paidAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "Transaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "Transaction_reference_key" ON "Transaction"("reference");
CREATE INDEX "Transaction_orderId_idx" ON "Transaction"("orderId");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX "Transaction_providerTxnId_idx" ON "Transaction"("providerTxnId");

-- CreateEnum
CREATE TYPE "AddonPricingType" AS ENUM ('FIXED', 'PER_IMAGE');

-- AlterTable
ALTER TABLE "Addon" ADD COLUMN "pricingType" "AddonPricingType" NOT NULL DEFAULT 'FIXED';

-- CreateTable
CREATE TABLE "OrderAddon" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "addonId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "unitPrice" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "pricingType" "AddonPricingType" NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "credits" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderAddon_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderAddon_orderId_idx" ON "OrderAddon"("orderId");

-- CreateIndex
CREATE INDEX "OrderAddon_addonId_idx" ON "OrderAddon"("addonId");

-- AddForeignKey
ALTER TABLE "OrderAddon" ADD CONSTRAINT "OrderAddon_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderAddon" ADD CONSTRAINT "OrderAddon_addonId_fkey" FOREIGN KEY ("addonId") REFERENCES "Addon"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

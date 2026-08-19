-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN "subtotal" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- Backfill subtotal from quantity * unitPrice for any existing rows
UPDATE "OrderItem" SET "subtotal" = "quantity" * "unitPrice" WHERE "subtotal" = 0;

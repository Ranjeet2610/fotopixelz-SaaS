-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'SUBMITTED' AFTER 'DRAFT';

-- AlterTable
ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;

-- Backfill order numbers for existing orders (sequential per year)
WITH numbered AS (
  SELECT
    id,
    'FP-' || to_char("createdAt", 'YYYY') || '-' || lpad(
      row_number() OVER (
        PARTITION BY to_char("createdAt", 'YYYY')
        ORDER BY "createdAt", id
      )::text,
      6,
      '0'
    ) AS generated_number
  FROM "Order"
)
UPDATE "Order" AS o
SET "orderNumber" = numbered.generated_number
FROM numbered
WHERE o.id = numbered.id;

ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");
CREATE INDEX "Order_orderNumber_idx" ON "Order"("orderNumber");

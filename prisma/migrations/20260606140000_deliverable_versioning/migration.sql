-- Order revision tracking
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "reviewRound" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliverableVersion" INTEGER NOT NULL DEFAULT 0;

-- Asset versioning fields
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "version" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "reviewRound" INTEGER NOT NULL DEFAULT 1;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "isCurrent" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "uploadedById" TEXT;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "qaNotes" JSONB;
ALTER TABLE "Asset" ADD COLUMN IF NOT EXISTS "replacesAssetId" TEXT;

CREATE INDEX IF NOT EXISTS "Asset_orderId_version_idx" ON "Asset"("orderId", "version");
CREATE INDEX IF NOT EXISTS "Asset_orderId_reviewRound_idx" ON "Asset"("orderId", "reviewRound");
CREATE INDEX IF NOT EXISTS "Asset_orderId_isCurrent_idx" ON "Asset"("orderId", "isCurrent");
CREATE INDEX IF NOT EXISTS "Asset_uploadedById_idx" ON "Asset"("uploadedById");

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_uploadedById_fkey"
  FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Asset" ADD CONSTRAINT "Asset_replacesAssetId_fkey"
  FOREIGN KEY ("replacesAssetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Workflow event types
ALTER TYPE "WorkflowEventType" ADD VALUE IF NOT EXISTS 'DELIVERABLE_VERSION_UPLOADED';
ALTER TYPE "WorkflowEventType" ADD VALUE IF NOT EXISTS 'REVISION_SUBMITTED';

-- Backfill: existing READY/DELIVERED assets are current at version 1
UPDATE "Asset"
SET "version" = 1,
    "reviewRound" = 1,
    "isCurrent" = true,
    "uploadedById" = "createdById"
WHERE "isDeleted" = false
  AND "status" IN ('READY', 'DELIVERED', 'PENDING', 'PROCESSING');

UPDATE "Order" o
SET "deliverableVersion" = COALESCE((
  SELECT MAX("version") FROM "Asset" a WHERE a."orderId" = o."id" AND a."isDeleted" = false
), 0)
WHERE "isDeleted" = false;

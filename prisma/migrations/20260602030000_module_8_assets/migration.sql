ALTER TYPE "AssetStatus" RENAME TO "AssetStatus_old";

CREATE TYPE "AssetStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'DELIVERED', 'ARCHIVED');

ALTER TABLE "Asset" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Asset"
ALTER COLUMN "status" TYPE "AssetStatus"
USING (
    CASE "status"::text
        WHEN 'UPLOADED' THEN 'PENDING'
        WHEN 'READY_FOR_EDITING' THEN 'READY'
        WHEN 'EDITED' THEN 'READY'
        WHEN 'QA_PENDING' THEN 'READY'
        WHEN 'READY_FOR_DELIVERY' THEN 'READY'
        ELSE "status"::text
    END
)::"AssetStatus";

ALTER TABLE "Asset" ALTER COLUMN "status" SET DEFAULT 'PENDING';

DROP TYPE "AssetStatus_old";

ALTER TABLE "Asset"
ADD COLUMN "organizationId" TEXT,
ADD COLUMN "uploadId" TEXT,
ADD COLUMN "name" TEXT,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "storageProvider" "StorageProvider",
ADD COLUMN "storageKey" TEXT,
ADD COLUMN "storageUrl" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "Asset"
SET
    "organizationId" = "Order"."organizationId",
    "createdById" = "Order"."createdById",
    "name" = "Asset"."fileName",
    "mimeType" = 'application/octet-stream',
    "storageProvider" = 'CLOUDFLARE_R2',
    "storageKey" = COALESCE(NULLIF("Asset"."originalUrl", ''), "Asset"."fileName"),
    "storageUrl" = "Asset"."originalUrl"
FROM "Order"
WHERE "Asset"."orderId" = "Order"."id";

ALTER TABLE "Asset"
ALTER COLUMN "organizationId" SET NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "mimeType" SET NOT NULL,
ALTER COLUMN "storageProvider" SET NOT NULL,
ALTER COLUMN "storageKey" SET NOT NULL,
ALTER COLUMN "createdById" SET NOT NULL,
ALTER COLUMN "originalUrl" DROP NOT NULL;

DROP INDEX IF EXISTS "AssetVersion_assetId_version_key";

ALTER TABLE "AssetVersion" RENAME COLUMN "version" TO "versionNumber";
ALTER TABLE "AssetVersion" RENAME COLUMN "fileUrl" TO "storageUrl";

ALTER TABLE "AssetVersion"
ADD COLUMN "fileName" TEXT,
ADD COLUMN "mimeType" TEXT,
ADD COLUMN "storageProvider" "StorageProvider",
ADD COLUMN "storageKey" TEXT,
ADD COLUMN "createdById" TEXT,
ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

UPDATE "AssetVersion"
SET
    "fileName" = CONCAT('version-', "AssetVersion"."versionNumber"),
    "mimeType" = 'application/octet-stream',
    "storageProvider" = "Asset"."storageProvider",
    "storageKey" = COALESCE(NULLIF("AssetVersion"."storageUrl", ''), "AssetVersion"."id"),
    "createdById" = "Asset"."createdById"
FROM "Asset"
WHERE "AssetVersion"."assetId" = "Asset"."id";

ALTER TABLE "AssetVersion"
ALTER COLUMN "fileName" SET NOT NULL,
ALTER COLUMN "mimeType" SET NOT NULL,
ALTER COLUMN "storageProvider" SET NOT NULL,
ALTER COLUMN "storageKey" SET NOT NULL,
ALTER COLUMN "createdById" SET NOT NULL,
ALTER COLUMN "storageUrl" DROP NOT NULL;

CREATE UNIQUE INDEX "AssetVersion_assetId_versionNumber_key" ON "AssetVersion"("assetId", "versionNumber");

CREATE INDEX "Asset_organizationId_status_idx" ON "Asset"("organizationId", "status");
CREATE INDEX "Asset_uploadId_idx" ON "Asset"("uploadId");
CREATE INDEX "Asset_createdById_idx" ON "Asset"("createdById");
CREATE INDEX "Asset_isDeleted_idx" ON "Asset"("isDeleted");
CREATE INDEX "AssetVersion_isDeleted_idx" ON "AssetVersion"("isDeleted");

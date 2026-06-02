CREATE TYPE "StorageProvider" AS ENUM ('AWS_S3', 'CLOUDFLARE_R2');

CREATE TYPE "UploadStatus" AS ENUM ('PENDING', 'UPLOADED', 'FAILED', 'DELETED');

CREATE TABLE "Upload" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "orderId" TEXT,
    "originalName" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "storageProvider" "StorageProvider" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "storageUrl" TEXT,
    "status" "UploadStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Upload_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Upload_organizationId_status_idx" ON "Upload"("organizationId", "status");

CREATE INDEX "Upload_userId_idx" ON "Upload"("userId");

CREATE INDEX "Upload_orderId_idx" ON "Upload"("orderId");

CREATE INDEX "Upload_storageProvider_idx" ON "Upload"("storageProvider");

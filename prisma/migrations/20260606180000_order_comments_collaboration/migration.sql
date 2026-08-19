-- CreateEnum
CREATE TYPE "CommentType" AS ENUM ('GENERAL', 'REVISION', 'CLIENT_FEEDBACK', 'QA_NOTE', 'INTERNAL_NOTE', 'SYSTEM');

-- CreateEnum
CREATE TYPE "CommentStatus" AS ENUM ('OPEN', 'IN_PROGRESS', 'RESOLVED');

-- AlterEnum
ALTER TYPE "WorkflowEventType" ADD VALUE 'COMMENT_CREATED';
ALTER TYPE "WorkflowEventType" ADD VALUE 'COMMENT_RESOLVED';

-- CreateTable
CREATE TABLE "OrderComment" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "assetId" TEXT,
    "parentId" TEXT,
    "commentType" "CommentType" NOT NULL DEFAULT 'GENERAL',
    "status" "CommentStatus" NOT NULL DEFAULT 'OPEN',
    "body" TEXT NOT NULL,
    "attachmentStorageKey" TEXT,
    "attachmentFileName" TEXT,
    "attachmentMimeType" TEXT,
    "attachmentUrl" TEXT,
    "resolvedById" TEXT,
    "resolvedAt" TIMESTAMP(3),
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OrderComment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OrderComment_orderId_idx" ON "OrderComment"("orderId");
CREATE INDEX "OrderComment_assetId_idx" ON "OrderComment"("assetId");
CREATE INDEX "OrderComment_userId_idx" ON "OrderComment"("userId");
CREATE INDEX "OrderComment_commentType_idx" ON "OrderComment"("commentType");
CREATE INDEX "OrderComment_status_idx" ON "OrderComment"("status");
CREATE INDEX "OrderComment_createdAt_idx" ON "OrderComment"("createdAt");
CREATE INDEX "OrderComment_orderId_createdAt_idx" ON "OrderComment"("orderId", "createdAt");
CREATE INDEX "OrderComment_orderId_status_idx" ON "OrderComment"("orderId", "status");

-- AddForeignKey
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_assetId_fkey" FOREIGN KEY ("assetId") REFERENCES "Asset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_resolvedById_fkey" FOREIGN KEY ("resolvedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderComment" ADD CONSTRAINT "OrderComment_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "OrderComment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "WorkflowEvent_orderId_createdAt_idx" ON "WorkflowEvent"("orderId", "createdAt");

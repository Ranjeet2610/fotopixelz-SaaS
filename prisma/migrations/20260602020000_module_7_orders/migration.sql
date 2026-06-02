CREATE TYPE "OrderPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

ALTER TYPE "OrderStatus" RENAME TO "OrderStatus_old";

CREATE TYPE "OrderStatus" AS ENUM (
    'DRAFT',
    'UPLOADED',
    'PENDING',
    'ASSIGNED',
    'IN_PROGRESS',
    'READY_FOR_QA',
    'REVISION_REQUIRED',
    'APPROVED',
    'DELIVERED',
    'CANCELLED'
);

ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;

ALTER TABLE "Order"
ALTER COLUMN "status" TYPE "OrderStatus"
USING (
    CASE "status"::text
        WHEN 'CREATED' THEN 'DRAFT'
        WHEN 'SUBMITTED' THEN 'PENDING'
        WHEN 'AI_PROCESSING' THEN 'PENDING'
        WHEN 'AI_PREVIEW_READY' THEN 'PENDING'
        WHEN 'EDITOR_ASSIGNED' THEN 'ASSIGNED'
        WHEN 'EDITING' THEN 'IN_PROGRESS'
        WHEN 'EDITING_IN_PROGRESS' THEN 'IN_PROGRESS'
        WHEN 'QA_PENDING' THEN 'READY_FOR_QA'
        WHEN 'QA_REJECTED' THEN 'REVISION_REQUIRED'
        WHEN 'CLIENT_REVIEW' THEN 'REVISION_REQUIRED'
        WHEN 'REVISION_REQUESTED' THEN 'REVISION_REQUIRED'
        WHEN 'COMPLETED' THEN 'DELIVERED'
        WHEN 'CANCELED' THEN 'CANCELLED'
        ELSE "status"::text
    END
)::"OrderStatus";

ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'DRAFT';

DROP TYPE "OrderStatus_old";

ALTER TABLE "Order"
ADD COLUMN "categoryId" TEXT,
ADD COLUMN "assignedEditorId" TEXT,
ADD COLUMN "assignedQaId" TEXT,
ADD COLUMN "instructions" TEXT,
ADD COLUMN "priority" "OrderPriority" NOT NULL DEFAULT 'NORMAL',
ADD COLUMN "totalImages" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "creditsUsed" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "dueDate" TIMESTAMP(3),
ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "Order_assignedEditorId_status_idx" ON "Order"("assignedEditorId", "status");

CREATE INDEX "Order_assignedQaId_status_idx" ON "Order"("assignedQaId", "status");

CREATE INDEX "Order_categoryId_idx" ON "Order"("categoryId");

CREATE INDEX "Order_isDeleted_idx" ON "Order"("isDeleted");

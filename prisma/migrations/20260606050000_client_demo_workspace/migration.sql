-- CreateEnum
CREATE TYPE "OrganizationPlan" AS ENUM ('DEMO');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MembershipRole" AS ENUM ('OWNER', 'ADMIN', 'CLIENT', 'EDITOR', 'QA', 'SUPER_ADMIN');

-- AlterTable
ALTER TABLE "Organization"
ADD COLUMN "plan" "OrganizationPlan",
ADD COLUMN "subscriptionStatus" "SubscriptionStatus",
ADD COLUMN "trialEndsAt" TIMESTAMP(3),
ADD COLUMN "freeImageCredits" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "usedImageCredits" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Membership" ALTER COLUMN "role" DROP DEFAULT;
ALTER TABLE "Membership"
ALTER COLUMN "role" TYPE "MembershipRole" USING ("role"::text::"MembershipRole");
ALTER TABLE "Membership" ALTER COLUMN "role" SET DEFAULT 'CLIENT';

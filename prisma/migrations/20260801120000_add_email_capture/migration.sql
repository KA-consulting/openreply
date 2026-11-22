-- CreateEnum
CREATE TYPE "EmailCaptureStatus" AS ENUM ('AWAITING', 'CAPTURED');

-- AlterTable
ALTER TABLE "Automation" ADD COLUMN     "collectEmail" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "emailPromptMessage" TEXT,
ADD COLUMN     "emailInvalidMessage" TEXT;

-- CreateTable
CREATE TABLE "EmailCapture" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "instagramAccountId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "username" TEXT,
    "email" TEXT,
    "status" "EmailCaptureStatus" NOT NULL DEFAULT 'AWAITING',
    "promptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "capturedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailCapture_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EmailCapture_workspaceId_idx" ON "EmailCapture"("workspaceId");

-- CreateIndex
CREATE INDEX "EmailCapture_instagramAccountId_userId_status_idx" ON "EmailCapture"("instagramAccountId", "userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "EmailCapture_automationId_userId_key" ON "EmailCapture"("automationId", "userId");

-- AddForeignKey
ALTER TABLE "EmailCapture" ADD CONSTRAINT "EmailCapture_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCapture" ADD CONSTRAINT "EmailCapture_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailCapture" ADD CONSTRAINT "EmailCapture_instagramAccountId_fkey" FOREIGN KEY ("instagramAccountId") REFERENCES "InstagramAccount"("id") ON DELETE CASCADE ON UPDATE CASCADE;

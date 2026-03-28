-- CreateEnum
CREATE TYPE "BugType" AS ENUM ('TECHNICAL', 'UI_UX', 'PERFORMANCE', 'SECURITY', 'OTHER');

-- CreateEnum
CREATE TYPE "BugStatus" AS ENUM ('PENDING', 'REVIEWING', 'RESOLVED', 'DISMISSED');

-- AlterEnum
ALTER TYPE "NotificationType" ADD VALUE 'BUG_RESPONSE';

-- CreateTable
CREATE TABLE "BugReport" (
    "id" TEXT NOT NULL,
    "type" "BugType" NOT NULL,
    "description" TEXT NOT NULL,
    "location" TEXT,
    "status" "BugStatus" NOT NULL DEFAULT 'PENDING',
    "reporterId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BugReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BugResponse" (
    "id" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "adminId" TEXT NOT NULL,
    "bugReportId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BugResponse_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BugReport_status_idx" ON "BugReport"("status");

-- CreateIndex
CREATE INDEX "BugReport_type_idx" ON "BugReport"("type");

-- CreateIndex
CREATE INDEX "BugReport_reporterId_idx" ON "BugReport"("reporterId");

-- CreateIndex
CREATE INDEX "BugResponse_bugReportId_idx" ON "BugResponse"("bugReportId");

-- AddForeignKey
ALTER TABLE "BugReport" ADD CONSTRAINT "BugReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugResponse" ADD CONSTRAINT "BugResponse_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BugResponse" ADD CONSTRAINT "BugResponse_bugReportId_fkey" FOREIGN KEY ("bugReportId") REFERENCES "BugReport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

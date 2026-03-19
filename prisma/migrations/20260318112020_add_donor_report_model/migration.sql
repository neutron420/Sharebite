-- CreateTable
CREATE TABLE "DonorReport" (
    "id" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "details" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "reporterId" TEXT NOT NULL,
    "donorId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DonorReport_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DonorReport_donorId_idx" ON "DonorReport"("donorId");

-- CreateIndex
CREATE INDEX "DonorReport_status_idx" ON "DonorReport"("status");

-- AddForeignKey
ALTER TABLE "DonorReport" ADD CONSTRAINT "DonorReport_reporterId_fkey" FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorReport" ADD CONSTRAINT "DonorReport_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

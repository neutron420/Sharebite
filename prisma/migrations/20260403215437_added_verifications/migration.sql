-- CreateEnum
CREATE TYPE "RiderVerificationStatus" AS ENUM ('PENDING_NGO_REVIEW', 'NGO_APPROVED', 'NGO_REJECTED', 'ADMIN_APPROVED', 'ADMIN_REJECTED');

-- CreateTable
CREATE TABLE "RiderVerificationRequest" (
    "id" TEXT NOT NULL,
    "riderId" TEXT NOT NULL,
    "ngoId" TEXT NOT NULL,
    "status" "RiderVerificationStatus" NOT NULL DEFAULT 'PENDING_NGO_REVIEW',
    "ngoReviewedAt" TIMESTAMP(3),
    "ngoReviewNote" TEXT,
    "adminReviewedAt" TIMESTAMP(3),
    "adminReviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RiderVerificationRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RiderVerificationRequest_riderId_key" ON "RiderVerificationRequest"("riderId");

-- CreateIndex
CREATE INDEX "RiderVerificationRequest_ngoId_status_idx" ON "RiderVerificationRequest"("ngoId", "status");

-- CreateIndex
CREATE INDEX "RiderVerificationRequest_status_idx" ON "RiderVerificationRequest"("status");

-- AddForeignKey
ALTER TABLE "RiderVerificationRequest" ADD CONSTRAINT "RiderVerificationRequest_riderId_fkey" FOREIGN KEY ("riderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RiderVerificationRequest" ADD CONSTRAINT "RiderVerificationRequest_ngoId_fkey" FOREIGN KEY ("ngoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

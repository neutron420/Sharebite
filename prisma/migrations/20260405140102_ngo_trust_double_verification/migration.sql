-- CreateEnum
CREATE TYPE "NgoVerificationStatus" AS ENUM ('PENDING', 'ONLINE_VERIFIED', 'FIELD_VISIT_SCHEDULED', 'FIELD_VERIFIED', 'FULLY_VERIFIED', 'REJECTED');

-- CreateTable
CREATE TABLE "NgoVerification" (
    "id" TEXT NOT NULL,
    "ngoId" TEXT NOT NULL,
    "status" "NgoVerificationStatus" NOT NULL DEFAULT 'PENDING',
    "registrationCertUrl" TEXT,
    "panTanUrl" TEXT,
    "bankProofUrl" TEXT,
    "addressProofUrl" TEXT,
    "contactPersonIdUrl" TEXT,
    "onlineReviewNote" TEXT,
    "onlineVerifiedAt" TIMESTAMP(3),
    "onlineVerifiedById" TEXT,
    "fieldVisitCity" TEXT,
    "fieldOfficerId" TEXT,
    "fieldOfficerName" TEXT,
    "fieldVisitScheduledAt" TIMESTAMP(3),
    "fieldChecklist" JSONB,
    "officeExists" BOOLEAN,
    "keyPersonConfirmed" BOOLEAN,
    "fieldEvidencePhotoUrls" JSONB,
    "fieldNotes" TEXT,
    "fieldCheckInAt" TIMESTAMP(3),
    "fieldCheckOutAt" TIMESTAMP(3),
    "fieldCheckInLatitude" DOUBLE PRECISION,
    "fieldCheckInLongitude" DOUBLE PRECISION,
    "fieldCheckOutLatitude" DOUBLE PRECISION,
    "fieldCheckOutLongitude" DOUBLE PRECISION,
    "fieldVerifiedAt" TIMESTAMP(3),
    "fieldVerifiedById" TEXT,
    "finalReviewNote" TEXT,
    "finalReviewedAt" TIMESTAMP(3),
    "finalReviewedById" TEXT,
    "rejectionReason" TEXT,
    "rejectedAt" TIMESTAMP(3),
    "rejectedById" TEXT,
    "lastVerifiedAt" TIMESTAMP(3),
    "nextReverificationAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NgoVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NgoVerification_ngoId_key" ON "NgoVerification"("ngoId");

-- CreateIndex
CREATE INDEX "NgoVerification_status_idx" ON "NgoVerification"("status");

-- CreateIndex
CREATE INDEX "NgoVerification_fieldOfficerId_idx" ON "NgoVerification"("fieldOfficerId");

-- CreateIndex
CREATE INDEX "NgoVerification_fieldVisitCity_idx" ON "NgoVerification"("fieldVisitCity");

-- CreateIndex
CREATE INDEX "NgoVerification_nextReverificationAt_idx" ON "NgoVerification"("nextReverificationAt");

-- AddForeignKey
ALTER TABLE "NgoVerification" ADD CONSTRAINT "NgoVerification_ngoId_fkey" FOREIGN KEY ("ngoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "PickupRequest" ADD COLUMN     "deliveryImageUrl" TEXT,
ADD COLUMN     "handoverPin" TEXT,
ADD COLUMN     "step" INTEGER NOT NULL DEFAULT 1;

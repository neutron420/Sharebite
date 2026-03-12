/*
  Warnings:

  - A unique constraint covering the columns `[reviewerId,donationId]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `pickupEndTime` to the `FoodDonation` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pickupStartTime` to the `FoodDonation` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `quantity` on the `FoodDonation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Changed the type of `category` on the `FoodDonation` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Made the column `donationId` on table `Review` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "FoodCategory" AS ENUM ('VEG', 'NON_VEG', 'DAIRY', 'BAKERY', 'FRUITS_AND_VEGGIES', 'COOKED_FOOD', 'STAPLES', 'PACKAGED_FOOD', 'OTHERS');

-- DropForeignKey
ALTER TABLE "FoodDonation" DROP CONSTRAINT "FoodDonation_donorId_fkey";

-- DropForeignKey
ALTER TABLE "PickupRequest" DROP CONSTRAINT "PickupRequest_donationId_fkey";

-- DropForeignKey
ALTER TABLE "PickupRequest" DROP CONSTRAINT "PickupRequest_ngoId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_donationId_fkey";

-- AlterTable
ALTER TABLE "FoodDonation" ADD COLUMN     "pickupEndTime" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "pickupStartTime" TIMESTAMP(3) NOT NULL,
DROP COLUMN "quantity",
ADD COLUMN     "quantity" INTEGER NOT NULL,
DROP COLUMN "category",
ADD COLUMN     "category" "FoodCategory" NOT NULL;

-- AlterTable
ALTER TABLE "Review" ALTER COLUMN "donationId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "FoodDonation_category_idx" ON "FoodDonation"("category");

-- CreateIndex
CREATE INDEX "Review_donationId_idx" ON "Review"("donationId");

-- CreateIndex
CREATE UNIQUE INDEX "Review_reviewerId_donationId_key" ON "Review"("reviewerId", "donationId");

-- AddForeignKey
ALTER TABLE "FoodDonation" ADD CONSTRAINT "FoodDonation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_ngoId_fkey" FOREIGN KEY ("ngoId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PickupRequest" ADD CONSTRAINT "PickupRequest_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "FoodDonation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_donationId_fkey" FOREIGN KEY ("donationId") REFERENCES "FoodDonation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

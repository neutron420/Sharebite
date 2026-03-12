/*
  Warnings:

  - Added the required column `city` to the `FoodDonation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "FoodDonation" ADD COLUMN     "city" TEXT NOT NULL;

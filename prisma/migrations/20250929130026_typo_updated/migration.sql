/*
  Warnings:

  - You are about to drop the column `campignType` on the `Automation` table. All the data in the column will be lost.
  - Added the required column `campaignType` to the `Automation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Automation" DROP COLUMN "campignType",
ADD COLUMN     "campaignType" TEXT NOT NULL;

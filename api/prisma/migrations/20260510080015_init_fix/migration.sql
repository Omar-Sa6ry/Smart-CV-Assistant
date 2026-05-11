/*
  Warnings:

  - You are about to drop the column `cvId` on the `Analysis_History` table. All the data in the column will be lost.
  - You are about to drop the column `cvId` on the `CV_Analysis_Base` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Analysis_History" DROP CONSTRAINT "Analysis_History_cvId_fkey";

-- DropForeignKey
ALTER TABLE "CV_Analysis_Base" DROP CONSTRAINT "CV_Analysis_Base_cvId_fkey";

-- DropIndex
DROP INDEX "CV_Analysis_Base_cvId_analysisType_key";

-- AlterTable
ALTER TABLE "Analysis_History" DROP COLUMN "cvId";

-- AlterTable
ALTER TABLE "CV_Analysis_Base" DROP COLUMN "cvId";

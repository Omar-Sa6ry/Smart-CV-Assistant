/*
  Warnings:

  - You are about to drop the column `content` on the `CV` table. All the data in the column will be lost.
  - You are about to drop the column `isPublished` on the `CV` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "CV" DROP COLUMN "content",
DROP COLUMN "isPublished",
ADD COLUMN     "isDefault" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "summary" TEXT;

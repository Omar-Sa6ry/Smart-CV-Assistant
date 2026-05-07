/*
  Warnings:

  - Made the column `description` on table `Experience` required. This step will fail if there are existing NULL values in that column.

*/
-- CreateEnum
CREATE TYPE "Degree" AS ENUM ('diploma', 'bachelor', 'master', 'ungraduated');

-- AlterTable
ALTER TABLE "Experience" ALTER COLUMN "description" SET NOT NULL;

-- CreateTable
CREATE TABLE "Education" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "institution" VARCHAR(75) NOT NULL,
    "title" VARCHAR(150) NOT NULL,
    "location" VARCHAR(255),
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "gpa" DECIMAL(3,2),
    "description" VARCHAR(500) NOT NULL,
    "degree" "Degree" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Education_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Education" ADD CONSTRAINT "Education_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "CV"("id") ON DELETE CASCADE ON UPDATE CASCADE;

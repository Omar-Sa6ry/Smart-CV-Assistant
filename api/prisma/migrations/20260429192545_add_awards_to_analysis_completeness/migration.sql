-- AlterTable
ALTER TABLE "CV_Analysis_Completeness_Details" ADD COLUMN     "awardsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "hasAwards" BOOLEAN NOT NULL DEFAULT false;

/*
  Warnings:

  - Made the column `summary` on table `CV` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "CV" ALTER COLUMN "summary" SET NOT NULL;

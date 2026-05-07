/*
  Warnings:

  - Made the column `companyWebsite` on table `Experience` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `Experience` required. This step will fail if there are existing NULL values in that column.
  - Made the column `description` on table `Project` required. This step will fail if there are existing NULL values in that column.
  - Made the column `projectUrl` on table `Project` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Experience" ALTER COLUMN "companyWebsite" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL;

-- AlterTable
ALTER TABLE "Project" ALTER COLUMN "description" SET NOT NULL,
ALTER COLUMN "projectUrl" SET NOT NULL;

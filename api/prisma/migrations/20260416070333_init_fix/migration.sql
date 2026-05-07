/*
  Warnings:

  - The values [backend_database] on the enum `SkillCategory` will be removed. If these variants are still used in the database, this will fail.
  - You are about to alter the column `title` on the `CV` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(50)`.
  - You are about to alter the column `summary` on the `CV` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(250)`.
  - You are about to drop the column `achievements` on the `Experience` table. All the data in the column will be lost.
  - You are about to drop the column `isPersonalProject` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `isTeamProject` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `teamSize` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `technologiesUsed` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `yearsOfExperience` on the `Skill` table. All the data in the column will be lost.
  - You are about to drop the column `headline` on the `User` table. All the data in the column will be lost.
  - Added the required column `headline` to the `CV` table without a default value. This is not possible if the table is not empty.
  - Made the column `phone` on table `CV` required. This step will fail if there are existing NULL values in that column.
  - Made the column `location` on table `CV` required. This step will fail if there are existing NULL values in that column.
  - Made the column `credentialUrl` on table `Certification` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SkillCategory_new" AS ENUM ('programming_language', 'frontend', 'backend', 'mobile', 'game_development', 'embedded_systems', 'technical', 'database_storage', 'data_science_analytics', 'ai_machine_learning', 'cloud_computing', 'devops_infrastructure', 'networking', 'testing_qa', 'architecture_design', 'security', 'software_tools', 'methodology', 'soft_skills', 'domain_knowledge');
ALTER TABLE "public"."Skill" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "public"."SkillKeyword" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "SkillKeyword" ALTER COLUMN "category" TYPE "SkillCategory_new" USING ("category"::text::"SkillCategory_new");
ALTER TABLE "Skill" ALTER COLUMN "category" TYPE "SkillCategory_new" USING ("category"::text::"SkillCategory_new");
ALTER TYPE "SkillCategory" RENAME TO "SkillCategory_old";
ALTER TYPE "SkillCategory_new" RENAME TO "SkillCategory";
DROP TYPE "public"."SkillCategory_old";
ALTER TABLE "Skill" ALTER COLUMN "category" SET DEFAULT 'technical';
ALTER TABLE "SkillKeyword" ALTER COLUMN "category" SET DEFAULT 'technical';
COMMIT;

-- AlterTable
ALTER TABLE "CV" ADD COLUMN     "headline" VARCHAR(50) NOT NULL,
ALTER COLUMN "title" SET DATA TYPE VARCHAR(50),
ALTER COLUMN "summary" SET DATA TYPE VARCHAR(250),
ALTER COLUMN "phone" SET NOT NULL,
ALTER COLUMN "location" SET NOT NULL;

-- AlterTable
ALTER TABLE "Certification" ALTER COLUMN "credentialUrl" SET NOT NULL;

-- AlterTable
ALTER TABLE "Experience" DROP COLUMN "achievements";

-- AlterTable
ALTER TABLE "Project" DROP COLUMN "isPersonalProject",
DROP COLUMN "isTeamProject",
DROP COLUMN "teamSize",
DROP COLUMN "technologiesUsed";

-- AlterTable
ALTER TABLE "Skill" DROP COLUMN "yearsOfExperience";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "headline";

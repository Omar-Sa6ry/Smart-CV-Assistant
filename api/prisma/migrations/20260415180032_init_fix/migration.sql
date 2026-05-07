/*
  Warnings:

  - The values [soft,tool] on the enum `SkillCategory` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "SkillCategory_new" AS ENUM ('programming_language', 'backend_database', 'devops_infrastructure', 'security', 'software_tools', 'frontend', 'soft_skills', 'methodology', 'technical');
ALTER TABLE "public"."SkillKeyword" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "SkillKeyword" ALTER COLUMN "category" TYPE "SkillCategory_new" USING ("category"::text::"SkillCategory_new");
ALTER TYPE "SkillCategory" RENAME TO "SkillCategory_old";
ALTER TYPE "SkillCategory_new" RENAME TO "SkillCategory";
DROP TYPE "public"."SkillCategory_old";
ALTER TABLE "SkillKeyword" ALTER COLUMN "category" SET DEFAULT 'technical';
COMMIT;

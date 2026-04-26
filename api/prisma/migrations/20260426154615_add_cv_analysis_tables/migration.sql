-- CreateEnum
CREATE TYPE "AnalysisType" AS ENUM ('ats_compatibility', 'content_quality', 'completeness');

-- CreateEnum
CREATE TYPE "SuggestionPriority" AS ENUM ('high', 'medium', 'low');

-- CreateTable
CREATE TABLE "CV_Analysis_Base" (
    "id" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "analysisType" "AnalysisType" NOT NULL,
    "overallScore" DECIMAL(5,2) NOT NULL,
    "feedbackSummary" TEXT,
    "strengths" TEXT,
    "weaknesses" TEXT,
    "suggestions" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CV_Analysis_Base_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CV_Analysis_ATS_Details" (
    "analysisId" TEXT NOT NULL,
    "formattingScore" DECIMAL(5,2) NOT NULL,
    "compatibilityScore" DECIMAL(5,2) NOT NULL,
    "keywordMatchScore" DECIMAL(5,2) NOT NULL,
    "structureScore" DECIMAL(5,2) NOT NULL,
    "keywordsFound" INTEGER NOT NULL DEFAULT 0,
    "keywordsMissing" INTEGER NOT NULL DEFAULT 0,
    "foundKeywordsList" TEXT,
    "missingKeywordsList" TEXT,
    "hasTables" BOOLEAN NOT NULL DEFAULT false,
    "hasImages" BOOLEAN NOT NULL DEFAULT false,
    "hasSpecialChars" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CV_Analysis_ATS_Details_pkey" PRIMARY KEY ("analysisId")
);

-- CreateTable
CREATE TABLE "CV_Analysis_Content_Details" (
    "analysisId" TEXT NOT NULL,
    "languageScore" DECIMAL(5,2) NOT NULL,
    "achievementsScore" DECIMAL(5,2) NOT NULL,
    "clarityScore" DECIMAL(5,2) NOT NULL,
    "quantifiableResultsCount" INTEGER NOT NULL DEFAULT 0,
    "spellingErrorsCount" INTEGER NOT NULL DEFAULT 0,
    "spellingErrorsList" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CV_Analysis_Content_Details_pkey" PRIMARY KEY ("analysisId")
);

-- CreateTable
CREATE TABLE "CV_Analysis_Suggestion" (
    "id" TEXT NOT NULL,
    "analysisId" TEXT NOT NULL,
    "sectionName" VARCHAR(50) NOT NULL,
    "priority" "SuggestionPriority" NOT NULL DEFAULT 'medium',
    "message" TEXT NOT NULL,
    "originalText" TEXT,
    "suggestedText" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CV_Analysis_Suggestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CV_Analysis_Completeness_Details" (
    "analysisId" TEXT NOT NULL,
    "requiredSectionsScore" DECIMAL(5,2) NOT NULL,
    "optionalSectionsScore" DECIMAL(5,2) NOT NULL,
    "detailsScore" DECIMAL(5,2) NOT NULL,
    "consistencyScore" DECIMAL(5,2) NOT NULL,
    "hasContactInfo" BOOLEAN NOT NULL DEFAULT false,
    "hasExperience" BOOLEAN NOT NULL DEFAULT false,
    "hasEducation" BOOLEAN NOT NULL DEFAULT false,
    "hasSkills" BOOLEAN NOT NULL DEFAULT false,
    "hasSummary" BOOLEAN NOT NULL DEFAULT false,
    "hasCertifications" BOOLEAN NOT NULL DEFAULT false,
    "hasProjects" BOOLEAN NOT NULL DEFAULT false,
    "hasLanguages" BOOLEAN NOT NULL DEFAULT false,
    "experiencesCount" INTEGER NOT NULL DEFAULT 0,
    "educationsCount" INTEGER NOT NULL DEFAULT 0,
    "skillsCount" INTEGER NOT NULL DEFAULT 0,
    "certificationsCount" INTEGER NOT NULL DEFAULT 0,
    "projectsCount" INTEGER NOT NULL DEFAULT 0,
    "languagesCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CV_Analysis_Completeness_Details_pkey" PRIMARY KEY ("analysisId")
);

-- CreateTable
CREATE TABLE "Analysis_History" (
    "id" TEXT NOT NULL,
    "cvId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "analysisType" "AnalysisType" NOT NULL,
    "previousScore" DECIMAL(5,2),
    "newScore" DECIMAL(5,2) NOT NULL,
    "improvementPercentage" DECIMAL(5,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Analysis_History_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CV_Analysis_Base_cvId_analysisType_key" ON "CV_Analysis_Base"("cvId", "analysisType");

-- AddForeignKey
ALTER TABLE "CV_Analysis_Base" ADD CONSTRAINT "CV_Analysis_Base_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "CV"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CV_Analysis_Base" ADD CONSTRAINT "CV_Analysis_Base_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CV_Analysis_ATS_Details" ADD CONSTRAINT "CV_Analysis_ATS_Details_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CV_Analysis_Base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CV_Analysis_Content_Details" ADD CONSTRAINT "CV_Analysis_Content_Details_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CV_Analysis_Base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CV_Analysis_Suggestion" ADD CONSTRAINT "CV_Analysis_Suggestion_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CV_Analysis_Base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CV_Analysis_Completeness_Details" ADD CONSTRAINT "CV_Analysis_Completeness_Details_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "CV_Analysis_Base"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis_History" ADD CONSTRAINT "Analysis_History_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "CV"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Analysis_History" ADD CONSTRAINT "Analysis_History_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

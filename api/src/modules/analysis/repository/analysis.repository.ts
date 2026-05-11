import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { AnalysisType } from '@prisma/client';
import { IAnalysisRepository } from '../interfaces';

@Injectable()
export class AnalysisRepository implements IAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatest(userId: string) {
    return this.prisma.cvAnalysisBase.findFirst({
      where: { userId },
      include: {
        atsDetails: true,
        contentDetails: true,
        completenessDetails: true,
        detailedSuggestions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findHistory(userId: string) {
    return this.prisma.analysisHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveFullAnalysis(
    userId: string,
    aiResult: any,
    improvement: number,
    previousScore: number | null,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const base = await tx.cvAnalysisBase.create({
          data: {
            userId,
            analysisType: AnalysisType.ats_compatibility,
            overallScore: aiResult.overallScore,
            feedbackSummary: aiResult.feedbackSummary,
            strengths: aiResult.strengths ? JSON.stringify(aiResult.strengths) : null,
            weaknesses: aiResult.weaknesses ? JSON.stringify(aiResult.weaknesses) : null,
            suggestions: aiResult.suggestions ? JSON.stringify(aiResult.suggestions) : null,
            atsDetails: { 
              create: { 
                formattingScore: aiResult.atsDetails?.formattingScore || 0,
                compatibilityScore: aiResult.atsDetails?.compatibilityScore || 0,
                keywordMatchScore: aiResult.atsDetails?.keywordMatchScore || 0,
                structureScore: aiResult.atsDetails?.structureScore || 0,
                keywordsFound: aiResult.atsDetails?.keywordsFound || 0,
                keywordsMissing: aiResult.atsDetails?.keywordsMissing || 0,
                hasTables: !!aiResult.atsDetails?.hasTables,
                hasImages: !!aiResult.atsDetails?.hasImages,
                hasSpecialChars: !!aiResult.atsDetails?.hasSpecialChars,
                foundKeywordsList: aiResult.atsDetails?.foundKeywordsList ? JSON.stringify(aiResult.atsDetails.foundKeywordsList) : "[]",
                missingKeywordsList: aiResult.atsDetails?.missingKeywordsList ? JSON.stringify(aiResult.atsDetails.missingKeywordsList) : "[]",
              } 
            },
            contentDetails: { 
              create: { 
                languageScore: aiResult.contentDetails?.languageScore || 0,
                achievementsScore: aiResult.contentDetails?.achievementsScore || 0,
                clarityScore: aiResult.contentDetails?.clarityScore || 0,
                quantifiableResultsCount: aiResult.contentDetails?.quantifiableResultsCount || 0,
                spellingErrorsCount: aiResult.contentDetails?.spellingErrorsCount || 0,
                spellingErrorsList: aiResult.contentDetails?.spellingErrorsList ? JSON.stringify(aiResult.contentDetails.spellingErrorsList) : "[]",
              } 
            },
            completenessDetails: {
              create: {
                requiredSectionsScore: aiResult.completenessDetails?.requiredSectionsScore || 0,
                optionalSectionsScore: aiResult.completenessDetails?.optionalSectionsScore || 0,
                detailsScore: aiResult.completenessDetails?.detailsScore || 0,
                consistencyScore: aiResult.completenessDetails?.consistencyScore || 0,
                hasContactInfo: !!aiResult.completenessDetails?.hasContactInfo,
                hasExperience: !!aiResult.completenessDetails?.hasExperience,
                hasEducation: !!aiResult.completenessDetails?.hasEducation,
                hasSkills: !!aiResult.completenessDetails?.hasSkills,
                hasSummary: !!aiResult.completenessDetails?.hasSummary,
                hasCertifications: !!aiResult.completenessDetails?.hasCertifications,
                hasProjects: !!aiResult.completenessDetails?.hasProjects,
                hasLanguages: !!aiResult.completenessDetails?.hasLanguages,
                hasAwards: !!aiResult.completenessDetails?.hasAwards,
                awardsCount: aiResult.completenessDetails?.awardsCount || 0,
              },
            },
            detailedSuggestions: {
              createMany: {
                data: (aiResult.detailedSuggestions || []).map((s: any) => ({
                  sectionName: s.sectionName,
                  priority: s.priority.toLowerCase() as any,
                  message: s.message,
                  originalText: s.originalText,
                  suggestedText: s.suggestedText,
                })),
              },
            },
          },
          include: {
            atsDetails: true,
            contentDetails: true,
            completenessDetails: true,
            detailedSuggestions: true,
          },
        });

        await tx.analysisHistory.create({
          data: {
            userId,
            analysisType: AnalysisType.ats_compatibility,
            previousScore,
            newScore: aiResult.overallScore,
            improvementPercentage: improvement,
          },
        });

        return base;
      });
    } catch (error) {
      console.error('DATABASE TRANSACTION ERROR:', error);
      throw error;
    }
  }
}

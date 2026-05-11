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
                ...aiResult.atsDetails,
                foundKeywordsList: aiResult.atsDetails?.foundKeywordsList ? JSON.stringify(aiResult.atsDetails.foundKeywordsList) : null,
                missingKeywordsList: aiResult.atsDetails?.missingKeywordsList ? JSON.stringify(aiResult.atsDetails.missingKeywordsList) : null,
              } 
            },
            contentDetails: { 
              create: { 
                ...aiResult.contentDetails,
                spellingErrorsList: aiResult.contentDetails?.spellingErrorsList ? JSON.stringify(aiResult.contentDetails.spellingErrorsList) : null,
              } 
            },
            completenessDetails: {
              create: {
                ...aiResult.completenessDetails,
                hasAwards: !!aiResult.completenessDetails?.hasAwards,
                awardsCount: aiResult.completenessDetails?.awardsCount || 0,
              },
            },
            detailedSuggestions: {
              createMany: {
                data: aiResult.detailedSuggestions.map((s: any) => ({
                  sectionName: s.sectionName,
                  priority: s.priority.toLowerCase() as any, // Enum is lowercase in Prisma
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

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
    cvId: string | null,
    userId: string,
    aiResult: any,
    improvement: number,
    previousScore: number | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
      // 1. Clear old analysis to avoid unique constraint violation [cvId, analysisType]
      if (cvId) {
        await tx.cvAnalysisBase.deleteMany({
          where: { cvId, analysisType: AnalysisType.ats_compatibility },
        });
      }

      const base = await tx.cvAnalysisBase.create({
        data: {
          cvId,
          userId,
          analysisType: AnalysisType.ats_compatibility,
          overallScore: aiResult.overallScore,
          feedbackSummary: aiResult.feedbackSummary,
          strengths: aiResult.strengths,
          weaknesses: aiResult.weaknesses,
          suggestions: aiResult.suggestions,
          atsDetails: { create: { ...aiResult.atsDetails } },
          contentDetails: { create: { ...aiResult.contentDetails } },
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
          cvId,
          userId,
          analysisType: AnalysisType.ats_compatibility,
          previousScore,
          newScore: aiResult.overallScore,
          improvementPercentage: improvement,
        },
      });

      return base;
    });
  }
}

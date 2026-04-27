import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { AnalysisType } from '@prisma/client';
import { IAnalysisRepository } from '../interfaces';

@Injectable()
export class AnalysisRepository implements IAnalysisRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findLatest(cvId: string, userId: string) {
    return this.prisma.cvAnalysisBase.findFirst({
      where: { cvId, userId },
      include: {
        atsDetails: true,
        contentDetails: true,
        completenessDetails: true,
        detailedSuggestions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findHistory(cvId: string, userId: string) {
    return this.prisma.analysisHistory.findMany({
      where: { cvId, userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async saveFullAnalysis(
    cvId: string,
    userId: string,
    aiResult: any,
    improvement: number,
    previousScore: number | null,
  ) {
    return this.prisma.$transaction(async (tx) => {
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
          completenessDetails: { create: { ...aiResult.completenessDetails } },
          detailedSuggestions: {
            createMany: {
              data: aiResult.detailedSuggestions.map((s: any) => ({
                sectionName: s.sectionName,
                priority: s.priority.toUpperCase() as any,
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

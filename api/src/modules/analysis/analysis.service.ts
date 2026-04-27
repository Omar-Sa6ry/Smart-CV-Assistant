import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import axios from 'axios';
import { AnalysisDto, SuggestionPriority } from './models/analysis.model';
import { AnalysisType } from '@prisma/client';
import { I18nService } from 'nestjs-i18n';
import { AnalysisResponse } from './dtos/analysis.response';
import { AnalysisHistoryResponse } from './dtos/analysisHistory.response';

@Injectable()
export class AnalysisService {
  private readonly analysisServiceUrl =
    process.env.ANALYSIS_SERVICE_URL || 'http://localhost:8000';

  constructor(
    private readonly i18n: I18nService,
    private readonly prisma: PrismaService,
  ) {}

  async triggerAnalysis(
    cvId: string,
    userId: string,
  ): Promise<AnalysisResponse> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: {
        experiences: true,
        educations: true,
        skills: true,
        projects: true,
        languages: true,
        certifications: true,
      },
    });

    if (!cv || cv.userId !== userId)
      throw new NotFoundException(
        await this.i18n.t('analysis.CV_NOT_FOUND_OR_ACCESS_DENIED'),
      );

    const hasContent = 
      cv.summary || 
      cv.experiences.length > 0 || 
      cv.skills.length > 0 || 
      cv.projects.length > 0;

    if (!hasContent) {
      throw new BadRequestException(
        await this.i18n.t('analysis.CV_IS_EMPTY'),
      );
    }

    const lastAnalysis = await this.prisma.cvAnalysisBase.findFirst({
      where: { cvId, userId },
      include: {
        atsDetails: true,
        contentDetails: true,
        completenessDetails: true,
        detailedSuggestions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (lastAnalysis && cv.updatedAt <= lastAnalysis.createdAt) {
      const data: AnalysisDto = this.mapAiResultToDto(
        { ...lastAnalysis, predictedRole: 'Software Engineer' },
        lastAnalysis,
      );
      return {
        data,
        statusCode: 200,
        message: await this.i18n.t('analysis.SUCCESSFULY_RETRIEVED_FROM_CACHE'),
      };
    }

    const payload = {
      cvId: cv.id,
      title: cv.title,
      summary: cv.summary,
      experiences: cv.experiences,
      educations: cv.educations,
      skills: cv.skills,
      projects: cv.projects,
      languages: cv.languages,
      certifications: cv.certifications,
    };

    try {
      const response = await axios.post(
        `${this.analysisServiceUrl}/v1/analyze-cv`,
        payload,
      );
      const aiResult = response.data;

      const data: AnalysisDto = await this.saveAndMapAnalysis(
        cvId,
        userId,
        aiResult,
      );

      return {
        data,
        statusCode: response.status,
        message: await this.i18n.t('analysis.CV_ANALYZED_SUCCESSFULLY'),
      };
    } catch (error) {
      console.error('Analysis failed:', error.message);
      throw new InternalServerErrorException(
        await this.i18n.t('analysis.CV_FAILED_TO_ANALYZE'),
      );
    }
  }

  async analyzeUploadedCv(
    file: any,
    userId: string,
  ): Promise<AnalysisResponse> {
    const formData = new FormData();
    const fileBlob = new Blob([file.buffer], { type: file.mimetype });
    formData.append('file', fileBlob, file.originalname);

    try {
      const response = await axios.post(
        `${this.analysisServiceUrl}/v1/analyze-file`,
        formData,
      );
      const aiResult = response.data;
      const data: AnalysisDto = this.mapAiResultToDto(aiResult);

      return {
        data,
        statusCode: response.status,
        message: await this.i18n.t('analysis.CV_ANALYZED_SUCCESSFULLY'),
      };
    } catch (error) {
      console.error('File analysis failed:', error.message);
      throw new InternalServerErrorException(
        await this.i18n.t('analysis.CV_FAILED_TO_ANALYZE'),
      );
    }
  }

  async getLatestAnalysis(
    cvId: string,
    userId: string,
  ): Promise<AnalysisResponse> {
    const analysis = await this.prisma.cvAnalysisBase.findFirst({
      where: { cvId, userId },
      include: {
        atsDetails: true,
        contentDetails: true,
        completenessDetails: true,
        detailedSuggestions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!analysis) {
      throw new NotFoundException(
        await this.i18n.t('analysis.CV_NOT_FOUND_OR_ACCESS_DENIED'),
      );
    }

    // mock predictedRole for stored results since it's not in DB yet
    const data: AnalysisDto = this.mapAiResultToDto(
      { ...analysis, predictedRole: 'Software Engineer' },
      analysis,
    );
    return {
      data,
      statusCode: 200,
      message: await this.i18n.t('analysis.SUCCESSFULY_RETRIEVED'),
    };
  }

  async getAnalysisHistory(
    cvId: string,
    userId: string,
  ): Promise<AnalysisHistoryResponse> {
    const history = await this.prisma.analysisHistory.findMany({
      where: { cvId, userId },
      orderBy: { createdAt: 'desc' },
    });

    return {
      data: history.map((h) => ({
        overallScore: Number(h.newScore),
        improvement: Number(h.improvementPercentage),
        createdAt: h.createdAt,
      })),
      statusCode: 200,
      message: await this.i18n.t('analysis.SUCCESSFULY_RETRIEVED'),
    };
  }

  private async saveAndMapAnalysis(
    cvId: string,
    userId: string,
    aiResult: any,
  ): Promise<AnalysisDto> {
    const lastAnalysis = await this.prisma.cvAnalysisBase.findFirst({
      where: { cvId, userId },
      orderBy: { createdAt: 'desc' },
    });

    const previousScore = lastAnalysis
      ? Number(lastAnalysis.overallScore)
      : null;
    const newScore = aiResult.overallScore;
    const improvementPercentage = previousScore
      ? ((newScore - previousScore) / previousScore) * 100
      : 0;

    const savedAnalysis = await this.prisma.$transaction(async (tx) => {
      const base = await tx.cvAnalysisBase.create({
        data: {
          cvId,
          userId,
          analysisType: AnalysisType.ats_compatibility,
          overallScore: newScore,
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
          newScore,
          improvementPercentage,
        },
      });

      return base;
    });

    return this.mapAiResultToDto(aiResult, savedAnalysis);
  }

  private mapAiResultToDto(aiResult: any, savedData?: any): AnalysisDto {
    const data = savedData || aiResult;
    return {
      overallScore: Number(data.overallScore),
      feedbackSummary: data.feedbackSummary,
      predictedRole: aiResult.predictedRole || 'Developer',
      strengths: data.strengths,
      weaknesses: data.weaknesses,
      suggestions: data.suggestions,
      atsDetails: {
        ...data.atsDetails,
        formattingScore: Number(data.atsDetails.formattingScore),
        compatibilityScore: Number(data.atsDetails.compatibilityScore),
        keywordMatchScore: Number(data.atsDetails.keywordMatchScore),
        structureScore: Number(data.atsDetails.structureScore),
      } as any,
      contentDetails: {
        ...data.contentDetails,
        languageScore: Number(data.contentDetails.languageScore),
        achievementsScore: Number(data.contentDetails.achievementsScore),
        clarityScore: Number(data.contentDetails.clarityScore),
      } as any,
      completenessDetails: {
        ...data.completenessDetails,
        requiredSectionsScore: Number(
          data.completenessDetails.requiredSectionsScore,
        ),
        optionalSectionsScore: Number(
          data.completenessDetails.optionalSectionsScore,
        ),
        detailsScore: Number(data.completenessDetails.detailsScore),
        consistencyScore: Number(data.completenessDetails.consistencyScore),
      } as any,
      detailedSuggestions: data.detailedSuggestions.map((s: any) => ({
        ...s,
        priority: s.priority.toLowerCase() as SuggestionPriority,
      })),
    };
  }
}

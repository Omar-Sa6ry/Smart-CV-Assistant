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
import { RedisService } from '@bts-soft/core';
import { CvService } from '../cvBuilder/cv/cv.service';
import { FileUpload } from 'graphql-upload-ts';
import * as FormData from 'form-data';

@Injectable()
export class AnalysisService {
  private readonly analysisServiceUrl =
    process.env.ANALYSIS_SERVICE_URL || 'http://localhost:8000';
  private readonly CACHE_TTL = 86400; // 24 Hours in seconds

  constructor(
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly cvService: CvService,
    private readonly prisma: PrismaService,
  ) {}

  async triggerAnalysis(
    cvId: string,
    userId: string,
  ): Promise<AnalysisResponse> {
    const cvResponse = await this.cvService.getById(cvId, userId);
    if (!cvResponse?.data || cvResponse.data.userId !== userId) {
      throw new NotFoundException(
        await this.i18n.t('analysis.CV_NOT_FOUND_OR_ACCESS_DENIED'),
      );
    }

    const cv = cvResponse.data;
    if (!this.isValidCv(cv)) {
      throw new BadRequestException(await this.i18n.t('analysis.CV_IS_EMPTY'));
    }

    let lastAnalysis = await this.safeCacheGet(this.getLatestKey(cvId));
    if (!lastAnalysis) {
      lastAnalysis = await this.fetchLatestFromDb(cvId, userId);
      if (lastAnalysis)
        await this.safeCacheSet(this.getLatestKey(cvId), lastAnalysis);
    }

    const lastAnalysisCreatedAt = lastAnalysis ? new Date(lastAnalysis.createdAt as any) : null;
    const cvUpdatedAt = new Date(cv.updatedAt as any);

    if (lastAnalysis && lastAnalysisCreatedAt && cvUpdatedAt <= lastAnalysisCreatedAt) {
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

    // Call AI Service
    try {
      const response = await axios.post(
        `${this.analysisServiceUrl}/v1/analyze-cv`,
        this.preparePayload(cv),
      );
      const data = await this.saveAndMapAnalysis(cvId, userId, response.data);

      return {
        data,
        statusCode: response.status,
        message: await this.i18n.t('analysis.CV_ANALYZED_SUCCESSFULLY'),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        await this.i18n.t('analysis.CV_FAILED_TO_ANALYZE'),
      );
    }
  }

  async analyzeUploadedCv(
    file: FileUpload,
    userId: string,
  ): Promise<AnalysisResponse> {
    try {
      const { createReadStream, filename, mimetype } = await file;
      const stream = createReadStream();

      const formData = new (require('form-data'))();
      formData.append('file', stream, { filename, contentType: mimetype });

      const response = await axios.post(
        `${this.analysisServiceUrl}/v1/analyze-file`,
        formData,
        { headers: { ...formData.getHeaders() } },
      );

      const data: AnalysisDto = this.mapAiResultToDto(response.data);

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
    let analysis = await this.safeCacheGet(this.getLatestKey(cvId));

    if (!analysis) {
      analysis = await this.fetchLatestFromDb(cvId, userId);
      if (analysis) await this.safeCacheSet(this.getLatestKey(cvId), analysis);
    }

    if (!analysis)
      throw new NotFoundException(
        await this.i18n.t('analysis.CV_NOT_FOUND_OR_ACCESS_DENIED'),
      );

    return {
      data: this.mapAiResultToDto(
        { ...analysis, predictedRole: 'Software Engineer' },
        analysis,
      ),
      statusCode: 200,
      message: await this.i18n.t('analysis.SUCCESSFULY_RETRIEVED'),
    };
  }

  async getAnalysisHistory(
    cvId: string,
    userId: string,
  ): Promise<AnalysisHistoryResponse> {
    let history = await this.safeCacheGet(this.getHistoryKey(cvId));

    if (!history) {
      history = await this.prisma.analysisHistory.findMany({
        where: { cvId, userId },
        orderBy: { createdAt: 'desc' },
      });
      if (history) await this.safeCacheSet(this.getHistoryKey(cvId), history);
    }

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
    const lastAnalysis = await this.fetchLatestFromDb(cvId, userId);
    const previousScore = lastAnalysis
      ? Number(lastAnalysis.overallScore)
      : null;
    const newScore = aiResult.overallScore;
    const improvement = previousScore
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
          improvementPercentage: improvement,
        },
      });

      return base;
    });

    // 4. Atomic Cache Invalidation (Senior Practice)
    await Promise.all([
      this.safeCacheSet(this.getLatestKey(cvId), savedAnalysis),
      this.redisService.del(this.getHistoryKey(cvId)), // Delete history so it's refetched next time
    ]);

    return this.mapAiResultToDto(aiResult, savedAnalysis);
  }

  // --- Private Helpers ---

  private isValidCv(cv: any): boolean {
    return !!(
      cv?.summary ||
      cv?.experiences?.length > 0 ||
      cv?.skills?.length > 0 ||
      cv?.projects?.length > 0
    );
  }

  private preparePayload(cv: any) {
    return {
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
  }

  private async fetchLatestFromDb(cvId: string, userId: string) {
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

  private async safeCacheGet(key: string) {
    try {
      return await this.redisService.get(key);
    } catch (e) {
      console.error(`Redis Get Error [${key}]:`, e.message);
      return null;
    }
  }

  private async safeCacheSet(key: string, data: any) {
    try {
      await this.redisService.set(key, data, this.CACHE_TTL);
    } catch (e) {
      console.error(`Redis Set Error [${key}]:`, e.message);
    }
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

  private getLatestKey(cvId: string) {
    return `cv_analysis:latest:${cvId}`;
  }
  private getHistoryKey(cvId: string) {
    return `cv_analysis:history:${cvId}`;
  }
}

import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { AnalysisResponse } from './dtos/analysis.response';
import { AnalysisHistoryResponse } from './dtos/analysisHistory.response';
import { CvService } from '../cvBuilder/cv/cv.service';
import * as UploadMinimal from 'graphql-upload-minimal';
import { AnalysisRepository } from './repository/analysis.repository';

import { AiBridgeService } from './bridge/ai-bridge.service';
import { AnalysisMapper } from './mapper/analysis.mapper';
import { AnalysisCacheManager } from './cache/analysis.cache-manager';
import {
  IAnalysisService,
} from './interfaces';

@Injectable()
export class AnalysisService implements IAnalysisService {
  constructor(
    private readonly i18n: I18nService,
    private readonly cvService: CvService,
    private readonly repository: AnalysisRepository,
    private readonly aiBridge: AiBridgeService,
    private readonly mapper: AnalysisMapper,
    private readonly cache: AnalysisCacheManager,
  ) {}

  async triggerAnalysis(
    cvId: string,
    userId: string,
  ): Promise<AnalysisResponse> {
    // Get CV & Validate
    const cvResponse = await this.cvService.getById(cvId, userId, true);
    const cv = cvResponse?.data;
    if (!cv || cv.userId !== userId)
      throw new NotFoundException(
        await this.i18n.t('analysis.CV_NOT_FOUND_OR_ACCESS_DENIED'),
      );
    if (!this.isValidCv(cv))
      throw new BadRequestException(await this.i18n.t('analysis.CV_IS_EMPTY'));

    // Cache Check
    let lastAnalysis = await this.cache.getLatest(userId);
    if (!lastAnalysis) {
      lastAnalysis = await this.repository.findLatest( userId);
      if (lastAnalysis) await this.cache.setLatest(userId, lastAnalysis);
    }

    if (
      lastAnalysis &&
      new Date(cv.updatedAt as any) <= new Date(lastAnalysis.createdAt as any)
    ) {
      return {
        data: this.mapper.mapToDto(lastAnalysis, lastAnalysis),
        statusCode: 200,
        message: await this.i18n.t('analysis.SUCCESSFULY_RETRIEVED_FROM_CACHE'),
      };
    }

    // Process with AI & Save
    try {
      const aiResult = await this.aiBridge.analyzeJson(
        this.mapper.prepareAiPayload(cv),
      );

      const previousScore = lastAnalysis
        ? Number(lastAnalysis.overallScore)
        : null;
      const improvement = previousScore
        ? ((aiResult.overallScore - previousScore) / previousScore) * 100
        : 0;

      const savedData = await this.repository.saveFullAnalysis(
        cvId,
        userId,
        aiResult,
        improvement,
        previousScore,
      );

      // Update Caches
      await this.cache.invalidateAll(cvId);
      await this.cache.setLatest(cvId, savedData);

      return {
        data: this.mapper.mapToDto(aiResult, savedData),
        statusCode: 200,
        message: await this.i18n.t('analysis.CV_ANALYZED_SUCCESSFULLY'),
      };
    } catch (error) {
      console.error('Trigger Analysis Error:', error);
      throw new InternalServerErrorException(
        await this.i18n.t('analysis.CV_FAILED_TO_ANALYZE'),
      );
    }
  }

  async analyzeUploadedCv(
    file: UploadMinimal.FileUpload,
    userId: string,
  ): Promise<AnalysisResponse> {
    try {
      const { createReadStream, filename, mimetype } = await (file as any);
      const aiResult = await this.aiBridge.analyzeFile(
        createReadStream(),
        filename,
        mimetype,
      );

      // Check last score for improvement calculation
      let lastAnalysis = await this.cache.getLatest(userId);
      if (!lastAnalysis) {
        lastAnalysis = await this.repository.findLatest(userId);
      }

      const previousScore = lastAnalysis ? Number(lastAnalysis.overallScore) : null;
      const improvement = previousScore
        ? ((aiResult.overallScore - previousScore) / previousScore) * 100
        : 0;

      // Save to database with null cvId
      const savedData = await this.repository.saveFullAnalysis(
        null,
        userId,
        aiResult,
        improvement,
        previousScore,
      );

      // Save to cache
      await this.cache.setLatest(userId, savedData);

      return {
        data: this.mapper.mapToDto(aiResult, savedData),
        statusCode: 200,
        success: true,
        message: await this.i18n.t('analysis.CV_ANALYZED_SUCCESSFULLY'),
      };
    } catch (error) {
      console.error('Analyze Uploaded Cv Error:', error);
      throw new InternalServerErrorException(
        await this.i18n.t('analysis.CV_FAILED_TO_ANALYZE'),
      );
    }
  }

  async getLatestAnalysis(userId: string): Promise<AnalysisResponse> {
    try {
      let lastAnalysis = await this.cache.getLatest(userId);
      if (!lastAnalysis) {
        lastAnalysis = await this.repository.findLatest(userId);
        if (lastAnalysis) await this.cache.setLatest(userId, lastAnalysis);
      }

      if (!lastAnalysis) {
        return {
          data: null,
          statusCode: 404,
          success: false,
          message: await this.i18n.t('analysis.CV_ANALYSIS_NOT_FOUND', {
            defaultValue: 'CV analysis not found',
          }),
        } as unknown as AnalysisResponse;
      }

      return {
        data: this.mapper.mapToDto(lastAnalysis, lastAnalysis),
        statusCode: 200,
        success: true,
        message: await this.i18n.t('analysis.SUCCESSFULY_RETRIEVED', {
          defaultValue: 'Analysis retrieved successfully',
        }),
      };
    } catch (error) {
      console.error('Get Latest Analysis Error:', error);
      throw new InternalServerErrorException(
        await this.i18n.t('analysis.FAILED_TO_RETRIEVE', {
          defaultValue: 'Failed to retrieve analysis',
        }),
      );
    }
  }

  async getAnalysisHistory(userId: string): Promise<AnalysisHistoryResponse> {
    try {
      const history = await this.repository.findHistory(userId);

      return {
        data: history.map((item) => ({
          overallScore: Number(item.newScore),
          improvement: Number(item.improvementPercentage),
          createdAt: item.createdAt as unknown as Date,
        })),
        statusCode: 200,
        success: true,
        message: await this.i18n.t('analysis.SUCCESSFULY_RETRIEVED', {
          defaultValue: 'Analysis history retrieved successfully',
        }),
      };
    } catch (error) {
      console.error('Get Analysis History Error:', error);
      throw new InternalServerErrorException(
        await this.i18n.t('analysis.FAILED_TO_RETRIEVE', {
          defaultValue: 'Failed to retrieve analysis history',
        }),
      );
    }
  }

  private isValidCv(cv: any) {
    return !!(
      cv?.summary ||
      cv?.experiences?.length > 0 ||
      cv?.skills?.length > 0 ||
      cv?.projects?.length > 0 ||
      cv?.awards?.length > 0
    );
  }
}

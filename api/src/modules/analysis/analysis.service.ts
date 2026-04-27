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
import { FileUpload } from 'graphql-upload-ts';
import { AnalysisRepository } from './repository/analysis.repository';
import { AiBridgeService } from './bridge/ai-bridge.service';
import { AnalysisMapper } from './mapper/analysis.mapper';
import { AnalysisCacheManager } from './cache/analysis.cache-manager';
import {
  IAnalysisService,
  IAnalysisRepository,
  IAiBridgeService,
  IAnalysisMapper,
  IAnalysisCacheManager,
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
    const cvResponse = await this.cvService.getById(cvId, userId);
    const cv = cvResponse?.data;
    if (!cv || cv.userId !== userId)
      throw new NotFoundException(
        await this.i18n.t('analysis.CV_NOT_FOUND_OR_ACCESS_DENIED'),
      );
    if (!this.isValidCv(cv))
      throw new BadRequestException(await this.i18n.t('analysis.CV_IS_EMPTY'));

    // Cache Check
    let lastAnalysis = await this.cache.getLatest(cvId);
    if (!lastAnalysis) {
      lastAnalysis = await this.repository.findLatest(cvId, userId);
      if (lastAnalysis) await this.cache.setLatest(cvId, lastAnalysis);
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
      const aiResult = await this.aiBridge.analyzeFile(
        createReadStream(),
        filename,
        mimetype,
      );

      return {
        data: this.mapper.mapToDto(aiResult),
        statusCode: 200,
        message: await this.i18n.t('analysis.CV_ANALYZED_SUCCESSFULLY'),
      };
    } catch (error) {
      throw new InternalServerErrorException(
        await this.i18n.t('analysis.CV_FAILED_TO_ANALYZE'),
      );
    }
  }

  async getLatestAnalysis(
    cvId: string,
    userId: string,
  ): Promise<AnalysisResponse> {
    let analysis = await this.cache.getLatest(cvId);
    if (!analysis) {
      analysis = await this.repository.findLatest(cvId, userId);
      if (analysis) await this.cache.setLatest(cvId, analysis);
    }

    if (!analysis)
      throw new NotFoundException(
        await this.i18n.t('analysis.CV_NOT_FOUND_OR_ACCESS_DENIED'),
      );

    return {
      data: this.mapper.mapToDto(
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
    let history = await this.cache.getHistory(cvId);
    if (!history) {
      history = await this.repository.findHistory(cvId, userId);
      if (history) await this.cache.setHistory(cvId, history);
    }

    return {
      data: history.map((h: any) => ({
        overallScore: Number(h.newScore),
        improvement: Number(h.improvementPercentage),
        createdAt: h.createdAt,
      })),
      statusCode: 200,
      message: await this.i18n.t('analysis.SUCCESSFULY_RETRIEVED'),
    };
  }

  private isValidCv(cv: any) {
    return !!(
      cv?.summary ||
      cv?.experiences?.length > 0 ||
      cv?.skills?.length > 0 ||
      cv?.projects?.length > 0
    );
  }
}

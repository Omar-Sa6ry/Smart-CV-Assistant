import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisResolver } from './analysis.resolver';
import { RedisModule } from '@bts-soft/core';
import { CvModule } from '../cvBuilder/cv/cv.module';
import { AnalysisRepository } from './repository/analysis.repository';
import { AiBridgeService } from './bridge/ai-bridge.service';
import { AnalysisMapper } from './mapper/analysis.mapper';
import { AnalysisCacheManager } from './cache/analysis.cache-manager';

@Module({
  imports: [RedisModule, CvModule],
  providers: [
    AnalysisService,
    AnalysisResolver,
    AnalysisRepository,
    AiBridgeService,
    AnalysisMapper,
    AnalysisCacheManager,
  ],
  exports: [AnalysisService],
})
export class AnalysisModule {}

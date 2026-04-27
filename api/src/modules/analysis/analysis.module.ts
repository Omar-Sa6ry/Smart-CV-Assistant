import { Module } from '@nestjs/common';
import { AnalysisService } from './analysis.service';
import { AnalysisResolver } from './analysis.resolver';
import { RedisModule } from '@bts-soft/core';
import { CvModule } from '../cvBuilder/cv/cv.module';

@Module({
  imports: [RedisModule,CvModule],
  providers: [AnalysisService, AnalysisResolver],
  exports: [AnalysisService],
})
export class AnalysisModule {}

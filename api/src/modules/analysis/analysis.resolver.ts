import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AnalysisService } from './analysis.service';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AnalysisResponse } from './dtos/analysis.response';
import { CurrentUser } from 'src/common/decorator/currentUser.decorator';
import { CurrentUserDto } from '@bts-soft/core';
import { Permission } from 'src/common/constant/enum.constant';
import { AnalysisHistoryResponse } from './dtos/analysisHistory.response';
import { GraphQLUpload } from 'graphql-upload-ts';
import type { FileUpload } from 'graphql-upload-ts';

@Resolver()
export class AnalysisResolver {
  constructor(private readonly analysisService: AnalysisService) {}

  @Mutation(() => AnalysisResponse)
  @Auth([Permission.ANALYSIS_CV])
  async analyzeCv(
    @CurrentUser() user: CurrentUserDto,
    @Args('cvId') cvId: string,
  ): Promise<AnalysisResponse> {
    return this.analysisService.triggerAnalysis(cvId, user.id);
  }

  @Mutation(() => AnalysisResponse)
  @Auth([Permission.ANALYSIS_CV])
  async analyzeUploadedCv(
    @CurrentUser() user: CurrentUserDto,
    @Args({ name: 'file', type: () => GraphQLUpload, nullable: true }) file: FileUpload,
  ): Promise<AnalysisResponse> {
    return this.analysisService.analyzeUploadedCv(file, user.id);
  }

  @Query(() => AnalysisResponse)
  @Auth([Permission.GET_LATEST_ANALYSIS])
  async getLatestCvAnalysis(
    @CurrentUser() user: CurrentUserDto,
    @Args('cvId') cvId: string,
  ): Promise<AnalysisResponse> {
    return this.analysisService.getLatestAnalysis(cvId, user.id);
  }

  @Query(() => AnalysisHistoryResponse)
  async getCvAnalysisHistory(
    @CurrentUser() user: CurrentUserDto,
    @Args('cvId') cvId: string,
  ): Promise<AnalysisHistoryResponse> {
    return this.analysisService.getAnalysisHistory(cvId, user.id);
  }
}

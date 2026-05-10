import { Resolver, Mutation, Args, Query } from '@nestjs/graphql';
import { AnalysisService } from './analysis.service';
import { Auth } from 'src/common/decorator/auth.decorator';
import { AnalysisResponse } from './dtos/analysis.response';
import { CurrentUser } from 'src/common/decorator/currentUser.decorator';
import { CurrentUserDto } from '@bts-soft/core';
import * as UploadMinimal from 'graphql-upload-minimal';
import { Permission } from 'src/common/constant/enum.constant';
import { AnalysisHistoryResponse } from './dtos/analysisHistory.response';

@Resolver()
export class AnalysisResolver {
  constructor(private readonly analysisService: AnalysisService) {}

  @Mutation(() => AnalysisResponse)
  @Auth([Permission.ANALYSIS_CV])
  async analyzeUploadedCv(
    @CurrentUser() user: CurrentUserDto,
    @Args({
      name: 'file',
      type: () => UploadMinimal.GraphQLUpload,
      nullable: true,
    })
    file: UploadMinimal.FileUpload,
  ): Promise<AnalysisResponse> {
    return this.analysisService.analyzeUploadedCv(file, user.id);
  }

  @Query(() => AnalysisResponse)
  @Auth([Permission.ANALYSIS_CV])
  async getLatestCvAnalysis(
    @CurrentUser() user: CurrentUserDto,
  ): Promise<AnalysisResponse> {
    return this.analysisService.getLatestAnalysis(user.id);
  }

  @Query(() => AnalysisHistoryResponse)
  @Auth([Permission.ANALYSIS_CV])
  async getCvAnalysisHistory(
    @CurrentUser() user: CurrentUserDto,
  ): Promise<AnalysisHistoryResponse> {
    return this.analysisService.getAnalysisHistory(user.id);
  }
}
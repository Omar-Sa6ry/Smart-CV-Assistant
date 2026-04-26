import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { BaseResponse, PaginationInfo } from '@bts-soft/core';
import { AnalysisDto } from '../models/analysis.model';

@ObjectType()
export class AnalysisDtoResponse extends BaseResponse {
  @Field(() => AnalysisDto, { nullable: true })
  @Expose()
  data?: AnalysisDto | null;
}

@ObjectType()
export class AnalysisDtosResponse extends BaseResponse {
  @Field(() => [AnalysisDto], { nullable: true })
  items: AnalysisDto[];

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo;
}

import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { GraphqlBaseResponse, PaginationInfo } from '@bts-soft/core';
import { AnalysisDto } from '../models/analysis.model';

@ObjectType()
export class AnalysisResponse extends GraphqlBaseResponse {
  @Field(() => AnalysisDto, { nullable: true })
  @Expose()
  data?: AnalysisDto | null;
}

@ObjectType()
export class AnalysissResponse extends GraphqlBaseResponse {
  @Field(() => [AnalysisDto], { nullable: true })
  items: AnalysisDto[];

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo;
}

import { Field, ObjectType } from '@nestjs/graphql';
import { BaseResponse } from '@bts-soft/core';

@ObjectType()
export class AnalysisHistoryItem {
  @Field(() => Number, { nullable: true })
  overallScore?: number;

  @Field(() => Number, { nullable: true })
  improvement?: number;

  @Field(() => Date, { nullable: true })
  createdAt?: Date;
}

@ObjectType()
export class AnalysisHistoryResponse extends BaseResponse {
  @Field(() => [AnalysisHistoryItem], { nullable: true })
  data: AnalysisHistoryItem[];
}

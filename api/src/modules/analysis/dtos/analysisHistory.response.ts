import { Field, ObjectType } from '@nestjs/graphql';
import { GraphqlBaseResponse } from '@bts-soft/core';

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
export class AnalysisHistoryResponse extends GraphqlBaseResponse {
  @Field(() => [AnalysisHistoryItem], { nullable: true })
  data: AnalysisHistoryItem[];
}

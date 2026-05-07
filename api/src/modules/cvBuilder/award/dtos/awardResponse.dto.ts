import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { BaseResponse, PaginationInfo } from '@bts-soft/core';
import { Award } from '../models/award.model';

@ObjectType()
export class AwardResponse extends BaseResponse {
  @Field(() => Award, { nullable: true })
  @Expose()
  data?: Award | null;
}

@ObjectType()
export class AwardsResponse extends BaseResponse {
  @Field(() => [Award], { nullable: true })
  items: Award[];

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo;
}

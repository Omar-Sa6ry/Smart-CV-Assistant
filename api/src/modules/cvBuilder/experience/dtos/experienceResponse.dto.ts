import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { BaseResponse, PaginationInfo } from '@bts-soft/core';
import { Experience } from '../models/experience.model';

@ObjectType()
export class ExperienceResponse extends BaseResponse {
  @Field(() => Experience, { nullable: true })
  @Expose()
  data?: Experience | null;
}

@ObjectType()
export class ExperiencesResponse extends BaseResponse {
  @Field(() => [Experience], { nullable: true })
  items: Experience[];

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo;
}

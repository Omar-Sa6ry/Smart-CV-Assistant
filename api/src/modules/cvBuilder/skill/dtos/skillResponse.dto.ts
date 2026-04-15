import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { BaseResponse, PaginationInfo } from '@bts-soft/core';
import { Skill } from '../models/skill.model';

@ObjectType()
export class SkillResponse extends BaseResponse {
  @Field(() => Skill, { nullable: true })
  @Expose()
  data?: Skill | null;
}

@ObjectType()
export class SkillsResponse extends BaseResponse {
  @Field(() => [Skill], { nullable: true })
  items: Skill[];

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo;
}

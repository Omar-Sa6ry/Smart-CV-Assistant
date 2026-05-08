import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { GraphqlBaseResponse, PaginationInfo } from '@bts-soft/core';
import { Skill } from '../models/skill.model';

@ObjectType()
export class SkillResponse extends GraphqlBaseResponse {
  @Field(() => Skill, { nullable: true })
  @Expose()
  data?: Skill | null;
}

@ObjectType()
export class SkillsResponse extends GraphqlBaseResponse {
  @Field(() => [Skill], { nullable: true })
  items: Skill[];

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo;
}

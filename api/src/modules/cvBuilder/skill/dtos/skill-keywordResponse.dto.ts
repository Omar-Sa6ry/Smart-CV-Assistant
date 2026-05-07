import { Field, ObjectType } from '@nestjs/graphql';
import { BaseResponse } from '@bts-soft/core';
import { SkillKeyword } from '../models/skill-keyword.model';

@ObjectType()
export class SkillKeywordsResponse extends BaseResponse {
  @Field(() => [SkillKeyword], { nullable: true })
  items: SkillKeyword[];
}

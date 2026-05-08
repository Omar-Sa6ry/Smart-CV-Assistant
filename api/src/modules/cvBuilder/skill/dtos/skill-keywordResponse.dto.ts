import { Field, ObjectType } from '@nestjs/graphql';
import { GraphqlBaseResponse } from '@bts-soft/core';
import { SkillKeyword } from '../models/skill-keyword.model';

@ObjectType()
export class SkillKeywordsResponse extends GraphqlBaseResponse {
  @Field(() => [SkillKeyword], { nullable: true })
  items: SkillKeyword[];
}

import { Field, InputType } from '@nestjs/graphql';
import { IsString, MinLength } from 'class-validator';

@InputType()
export class SearchSkillKeywordInput {
  @Field(() => String)
  @IsString()
  @MinLength(1)
  query: string;
}

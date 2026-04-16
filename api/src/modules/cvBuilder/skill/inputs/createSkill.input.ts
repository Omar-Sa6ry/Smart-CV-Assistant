import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsUUID, MaxLength, IsEnum } from 'class-validator';
import { SkillProficiency, SkillCategory } from '@prisma/client';

@InputType()
export class CreateSkillInput {
  @Field(() => String)
  @IsUUID()
  cvId: string;

  @Field(() => String)
  @IsString()
  @MaxLength(100)
  name: string;

  @Field(() => SkillCategory, {
    defaultValue: SkillCategory.technical,
  })
  @IsEnum(SkillCategory)
  category: SkillCategory;

  @Field(() => SkillProficiency, {
    defaultValue: SkillProficiency.intermediate,
  })
  @IsEnum(SkillProficiency)
  proficiency: SkillProficiency;
}

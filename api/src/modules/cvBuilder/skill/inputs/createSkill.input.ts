import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsUUID, MaxLength, IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { SkillProficiency } from '@prisma/client';

@InputType()
export class CreateSkillInput {
  @Field(() => String)
  @IsUUID()
  cvId: string;

  @Field(() => String)
  @IsString()
  @MaxLength(100)
  name: string;

  @Field(() => SkillProficiency, { defaultValue: SkillProficiency.intermediate })
  @IsEnum(SkillProficiency)
  proficiency: SkillProficiency;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;
}

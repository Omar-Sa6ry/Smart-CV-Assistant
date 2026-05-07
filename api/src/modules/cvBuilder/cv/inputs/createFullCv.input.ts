import {
  Field,
  InputType,
  PickType,
  PartialType,
  OmitType,
} from '@nestjs/graphql';
import { IsOptional } from 'class-validator';
import { CreateCvInput } from './createCv.Input';
import { CreateExperienceInput } from '../../experience/inputs/createExperience.input';
import { CreateEducationInput } from '../../education/inputs/createEducation.input';
import { CreateProjectInput } from '../../project/inputs/createProject.input';
import { CreateCertificationInput } from '../../certification/inputs/createCertification.input';
import { CreateLanguageInput } from '../../language/inputs/createLanguage.input';
import { CreateSkillInput } from '../../skill/inputs/createSkill.input';
import { CreateAwardInput } from '../../award/inputs/createAward.input';

@InputType()
export class CreateExperienceNestedInput extends OmitType(
  CreateExperienceInput,
  ['cvId'],
) {}

@InputType()
export class CreateEducationNestedInput extends OmitType(CreateEducationInput, [
  'cvId',
]) {}

@InputType()
export class CreateProjectNestedInput extends OmitType(CreateProjectInput, [
  'cvId',
]) {}

@InputType()
export class CreateCertificationNestedInput extends OmitType(
  CreateCertificationInput,
  ['cvId'],
) {}

@InputType()
export class CreateLanguageNestedInput extends OmitType(CreateLanguageInput, [
  'cvId',
]) {}

@InputType()
export class CreateSkillNestedInput extends OmitType(CreateSkillInput, [
  'cvId',
]) {}

@InputType()
export class CreateAwardNestedInput extends OmitType(CreateAwardInput, [
  'cvId',
]) {}

@InputType()
export class CreateFullCvInput extends CreateCvInput {
  @Field(() => [CreateExperienceNestedInput], { nullable: true })
  @IsOptional()
  experiences?: CreateExperienceNestedInput[];

  @Field(() => [CreateEducationNestedInput], { nullable: true })
  @IsOptional()
  educations?: CreateEducationNestedInput[];

  @Field(() => [CreateProjectNestedInput], { nullable: true })
  @IsOptional()
  projects?: CreateProjectNestedInput[];

  @Field(() => [CreateCertificationNestedInput], { nullable: true })
  @IsOptional()
  certifications?: CreateCertificationNestedInput[];

  @Field(() => [CreateLanguageNestedInput], { nullable: true })
  @IsOptional()
  languages?: CreateLanguageNestedInput[];

  @Field(() => [CreateSkillNestedInput], { nullable: true })
  @IsOptional()
  skills?: CreateSkillNestedInput[];

  @Field(() => [CreateAwardNestedInput], { nullable: true })
  @IsOptional()
  awards?: CreateAwardNestedInput[];
}

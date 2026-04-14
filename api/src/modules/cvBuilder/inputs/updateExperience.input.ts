import { Field, InputType, PartialType, OmitType } from '@nestjs/graphql';
import { CreateExperienceInput } from './createExperience.input';

@InputType()
export class UpdateExperienceInput extends PartialType(
  OmitType(CreateExperienceInput, ['cvId'] as const),
) {}

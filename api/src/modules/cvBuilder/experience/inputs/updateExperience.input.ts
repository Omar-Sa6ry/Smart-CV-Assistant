import { InputType, PartialType } from '@nestjs/graphql';
import { CreateExperienceInput } from './createExperience.input';

@InputType()
export class UpdateExperienceInput extends PartialType(CreateExperienceInput) {}

import { InputType, PartialType } from '@nestjs/graphql';
import { CreateEducationInput } from './createEducation.input';

@InputType()
export class UpdateEducationInput extends PartialType(CreateEducationInput) {}

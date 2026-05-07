import { InputType, PartialType } from '@nestjs/graphql';
import { CreateCvInput } from './createCv.Input';

@InputType()
export class UpdateCvInput extends PartialType(CreateCvInput) {}

import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { CreateAwardInput } from './createAward.input';

@InputType()
export class UpdateAwardInput extends PartialType(
  OmitType(CreateAwardInput, ['cvId'] as const),
) {}

import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { CreateCertificationInput } from './createCertification.input';

@InputType()
export class UpdateCertificationInput extends PartialType(
  CreateCertificationInput,
) {}

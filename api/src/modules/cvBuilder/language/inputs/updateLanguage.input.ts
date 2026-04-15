import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { CreateLanguageInput } from './createLanguage.input';

@InputType()
export class UpdateLanguageInput extends PartialType(
  OmitType(CreateLanguageInput, ['cvId'] as const),
) {}

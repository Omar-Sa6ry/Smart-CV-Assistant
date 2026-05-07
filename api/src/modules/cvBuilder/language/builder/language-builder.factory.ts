import { Injectable } from '@nestjs/common';
import { StandardLanguageBuilder } from './standard-language.builder';

@Injectable()
export class LanguageBuilderFactory {
  create(): StandardLanguageBuilder {
    return new StandardLanguageBuilder();
  }
}

import { Injectable } from '@nestjs/common';
import { StandardEducationBuilder } from './standard-education.builder';

@Injectable()
export class EducationBuilderFactory {
  create(): StandardEducationBuilder {
    return new StandardEducationBuilder();
  }
}

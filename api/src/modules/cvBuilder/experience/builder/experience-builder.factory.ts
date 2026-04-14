import { Injectable } from '@nestjs/common';
import { StandardExperienceBuilder } from './standard-experience.builder';

@Injectable()
export class ExperienceBuilderFactory {
  create(): StandardExperienceBuilder {
    return new StandardExperienceBuilder();
  }
}

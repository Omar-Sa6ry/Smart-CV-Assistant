import { Injectable } from '@nestjs/common';
import { StandardProjectBuilder } from './standard-project.builder';

@Injectable()
export class ProjectBuilderFactory {
  create(): StandardProjectBuilder {
    return new StandardProjectBuilder();
  }
}

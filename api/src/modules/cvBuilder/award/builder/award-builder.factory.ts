import { Injectable } from '@nestjs/common';
import { StandardAwardBuilder } from './standard-award.builder';

@Injectable()
export class AwardBuilderFactory {
  create(): StandardAwardBuilder {
    return new StandardAwardBuilder();
  }
}

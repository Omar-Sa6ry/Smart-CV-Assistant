import { Injectable } from '@nestjs/common';
import { StandardCvBuilder } from './standard-cv.builder';

@Injectable()
export class CvBuilderFactory {
  create(): StandardCvBuilder {
    return new StandardCvBuilder();
  }
}

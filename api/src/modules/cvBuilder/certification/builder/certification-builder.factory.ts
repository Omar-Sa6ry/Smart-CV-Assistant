import { Injectable } from '@nestjs/common';
import { StandardCertificationBuilder } from './standard-certification.builder';

@Injectable()
export class CertificationBuilderFactory {
  create(): StandardCertificationBuilder {
    return new StandardCertificationBuilder();
  }
}

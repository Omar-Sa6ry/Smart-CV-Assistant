import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from 'src/modules/users/users.module';
import { CertificationService } from './certification.service';
import { CertificationResolver } from './certification.resolver';
import { CertificationBuilderFactory } from './builder/certification-builder.factory';
import { CertificationFactory } from './factory/certification.factory';
import { CertificationLoader } from './loaders/certification.loader';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [UserModule, forwardRef(() => CvModule)],
  providers: [
    CertificationService,
    CertificationResolver,
    CertificationBuilderFactory,
    CertificationFactory,
    CertificationLoader,
  ],
  exports: [CertificationService, CertificationLoader],
})
export class CertificationModule {}

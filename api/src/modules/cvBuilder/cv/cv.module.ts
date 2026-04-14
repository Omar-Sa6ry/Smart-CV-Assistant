import { forwardRef, Module } from '@nestjs/common';
import { CvService } from './cv.service';
import { CvResolver } from './cv.resolver';
import { UserModule } from 'src/modules/users/users.module';
import { CvBuilderFactory } from './builder/cv-builder.factory';
import { ClassicPdfStrategy } from './strategies/classic-pdf.strategy';
import { ModernPdfStrategy } from './strategies/modern-pdf.strategy';
import { ExperienceModule } from '../experience/experience.module';
import { EducationModule } from '../education/education.module';
import { CertificationModule } from '../certification/certification.module';
import { ProjectModule } from '../project/project.module';

@Module({
  imports: [
    UserModule,
    forwardRef(() => ExperienceModule),
    forwardRef(() => EducationModule),
    forwardRef(() => CertificationModule),
    forwardRef(() => ProjectModule),
  ],
  providers: [
    CvService,
    CvResolver,
    CvBuilderFactory,
    ClassicPdfStrategy,
    ModernPdfStrategy,
  ],
  exports: [CvService],
})
export class CvModule {}

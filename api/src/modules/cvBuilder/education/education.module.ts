import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from 'src/modules/users/users.module';
import { EducationService } from './education.service';
import { EducationResolver } from './education.resolver';
import { EducationBuilderFactory } from './builder/education-builder.factory';
import { EducationFactory } from './factory/education.factory';
import { EducationLoader } from './loaders/education.loader';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [UserModule, forwardRef(() => CvModule)],
  providers: [
    EducationService,
    EducationResolver,
    EducationBuilderFactory,
    EducationFactory,
    EducationLoader,
  ],
  exports: [EducationService, EducationLoader],
})
export class EducationModule {}

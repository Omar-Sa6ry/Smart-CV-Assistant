import { Module } from '@nestjs/common';
import { UserModule } from 'src/modules/users/users.module';
import { ExperienceService } from '../services/experience.service';
import { ExperienceResolver } from '../resolvers/experience.resolver';
import { ExperienceBuilderFactory } from '../builder/experience-builder.factory';
import { ExperienceFactory } from '../factory/experience.factory';
import { ExperienceLoader } from '../loaders/experience.loader';
import { CvModule } from './cv.module';

@Module({
  imports: [UserModule],
  providers: [
    ExperienceService,
    ExperienceResolver,
    ExperienceBuilderFactory,
    ExperienceFactory,
    ExperienceLoader,
  ],
  exports: [ExperienceService, ExperienceLoader],
})
export class ExperienceModule {}

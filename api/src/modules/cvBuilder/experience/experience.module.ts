import { Module } from '@nestjs/common';
import { UserModule } from 'src/modules/users/users.module';
import { ExperienceService } from './experience.service';
import { ExperienceResolver } from './experience.resolver';
import { ExperienceBuilderFactory } from './builder/experience-builder.factory';
import { ExperienceFactory } from './factory/experience.factory';
import { ExperienceLoader } from './loaders/experience.loader';

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

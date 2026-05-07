import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from 'src/modules/users/users.module';
import { ProjectService } from './project.service';
import { ProjectResolver } from './project.resolver';
import { ProjectBuilderFactory } from './builder/project-builder.factory';
import { ProjectFactory } from './factory/project.factory';
import { ProjectLoader } from './loaders/project.loader';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [UserModule, forwardRef(() => CvModule)],
  providers: [
    ProjectService,
    ProjectResolver,
    ProjectBuilderFactory,
    ProjectFactory,
    ProjectLoader,
  ],
  exports: [ProjectService, ProjectLoader],
})
export class ProjectModule {}

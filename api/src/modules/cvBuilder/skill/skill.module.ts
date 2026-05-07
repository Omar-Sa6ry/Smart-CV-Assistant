import { Module, forwardRef } from '@nestjs/common';
import { SkillService } from './skill.service';
import { SkillResolver } from './skill.resolver';
import { SkillLoader } from './loaders/skill.loader';
import { SkillFactory } from './factory/skill.factory';
import { SkillBuilderFactory } from './builder/skill-builder.factory';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [forwardRef(() => CvModule)],
  providers: [
    SkillService,
    SkillResolver,
    SkillLoader,
    SkillFactory,
    SkillBuilderFactory,
  ],
  exports: [SkillService, SkillLoader],
})
export class SkillModule {}

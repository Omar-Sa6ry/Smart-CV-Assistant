import { forwardRef, Module } from '@nestjs/common';
import { CvService } from './cv.service';
import { CvResolver } from './cv.resolver';
import { UserModule } from 'src/modules/users/users.module';
import { CvBuilderFactory } from './builder/cv-builder.factory';
import { ExperienceModule } from '../experience/experience.module';
import { EducationModule } from '../education/education.module';
import { CertificationModule } from '../certification/certification.module';
import { ProjectModule } from '../project/project.module';
import { LanguageModule } from '../language/language.module';
import { SkillModule } from '../skill/skill.module';
import { AwardModule } from '../award/award.module';
import { RedisModule } from '@bts-soft/core';
import { CreateCvFascade } from './fascade/createCv.fascade';

@Module({
  imports: [
    UserModule,
    RedisModule,
    forwardRef(() => ExperienceModule),
    forwardRef(() => EducationModule),
    forwardRef(() => CertificationModule),
    forwardRef(() => ProjectModule),
    forwardRef(() => LanguageModule),
    forwardRef(() => SkillModule),
    forwardRef(() => AwardModule),
  ],
  providers: [CvService, CvResolver, CreateCvFascade, CvBuilderFactory],
  exports: [CvService],
})
export class CvModule {}

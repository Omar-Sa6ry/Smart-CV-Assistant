import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppResolver } from './app.resolver';
import { DatabaseModule } from './common/database/database';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/users.module';
import { OAuthModule } from './modules/oauth/oauth.module';
import { CvModule } from './modules/cvBuilder/cv/cv.module';
import { ExperienceModule } from './modules/cvBuilder/experience/experience.module';
import { EducationModule } from './modules/cvBuilder/education/education.module';
import { ProjectModule } from './modules/cvBuilder/project/project.module';
import { LanguageModule } from './modules/cvBuilder/language/language.module';
import { SkillModule } from './modules/cvBuilder/skill/skill.module';
import { ExportModule } from './modules/cvBuilder/export/export.module';
import {
  ConfigModule,
  GraphqlModule,
  ThrottlerModule,
  TranslationModule,
} from '@bts-soft/core';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    GraphqlModule,
    ThrottlerModule,
    TranslationModule,

    UserModule,
    AuthModule,
    OAuthModule,
    CvModule,
    ExperienceModule,
    EducationModule,
    ProjectModule,
    LanguageModule,
    SkillModule,
    ExportModule,
  ],
  providers: [AppService, AppResolver],
})
export class AppModule {}

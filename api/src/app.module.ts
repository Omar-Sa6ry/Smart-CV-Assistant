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
import { AwardModule } from './modules/cvBuilder/award/award.module';
import { ExportModule } from './modules/cvBuilder/export/export.module';
import {
  ConfigModule,
  GraphqlModule,
  ThrottlerModule,
  TranslationModule,
} from '@bts-soft/core';
import { AnalysisModule } from './modules/analysis/analysis.module';

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
    AwardModule,
    ExportModule,

    AnalysisModule,
  ],
  providers: [AppService, AppResolver],
})
export class AppModule {}

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
  ThrottlingModule,
  TranslationModule,
} from '@bts-soft/core';
import { AnalysisModule } from './modules/analysis/analysis.module';
import { BullModule } from '@nestjs/bullmq';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    GraphqlModule.forRoot(),
    ThrottlingModule.forRoot(),
    TranslationModule.forRoot(),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || undefined,
        tls:
          process.env.REDIS_TLS === 'true' || process.env.REDISTLS === 'true'
            ? {}
            : undefined,
      },
    }),

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

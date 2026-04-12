import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppResolver } from './app.resolver';
import { DatabaseModule } from './common/database/database';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/users/users.module';
import { OAuthModule } from './modules/oauth/oauth.module';
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
  ],
  providers: [AppService, AppResolver],
})
export class AppModule {}

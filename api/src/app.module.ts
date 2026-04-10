import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppResolver } from './app.resolver';
import { DatabaseModule } from './common/database/database';
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
  ],
  providers: [AppService, AppResolver],
})
export class AppModule {}

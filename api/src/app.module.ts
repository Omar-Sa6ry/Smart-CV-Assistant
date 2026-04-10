import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppResolver } from './app.resolver';
import {
  ConfigModule,
  GraphqlModule,
  ThrottlerModule,
  TranslationModule,
} from '@bts-soft/core';

@Module({
  imports: [ConfigModule, GraphqlModule, ThrottlerModule, TranslationModule],
  providers: [AppService, AppResolver],
})
export class AppModule {}

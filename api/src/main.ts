import * as bodyParser from 'body-parser';
import { json } from 'express';
import { NestFactory, Reflector } from '@nestjs/core';
import { I18nValidationException } from 'nestjs-i18n';
import { AppModule } from './app.module';
import {
  BadRequestException,
  ClassSerializerInterceptor,
  ValidationPipe,
} from '@nestjs/common';
import {
  GeneralResponseInterceptor,
  SqlInjectionInterceptor,
} from '@bts-soft/core';
import { setupGraphqlUpload } from '@bts-soft/upload';

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    app.enableCors();

    setupGraphqlUpload(app, 1000000, 1);

    app.useGlobalPipes(
      new ValidationPipe({
        transform: true,
        whitelist: true,
        stopAtFirstError: true,
        exceptionFactory: (errors) => new I18nValidationException(errors),
      }),
    );

    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(new Reflector()),
      new SqlInjectionInterceptor(),
      new GeneralResponseInterceptor(),
    );

    app.use('/google/callback', bodyParser.raw({ type: 'application/json' }));
    app.use(json());

    await app.listen(process.env.PORT || 5004);
  } catch (error) {
    console.error(error);
    throw new BadRequestException(error);
  }
}

bootstrap();

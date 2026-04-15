import { forwardRef, Module } from '@nestjs/common';
import { UserModule } from 'src/modules/users/users.module';
import { LanguageService } from './language.service';
import { LanguageResolver } from './language.resolver';
import { LanguageBuilderFactory } from './builder/language-builder.factory';
import { LanguageFactory } from './factory/language.factory';
import { LanguageLoader } from './loaders/language.loader';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [UserModule, forwardRef(() => CvModule)],
  providers: [
    LanguageService,
    LanguageResolver,
    LanguageBuilderFactory,
    LanguageFactory,
    LanguageLoader,
  ],
  exports: [LanguageService, LanguageLoader],
})
export class LanguageModule {}

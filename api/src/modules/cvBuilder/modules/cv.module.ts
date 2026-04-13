import { Module } from '@nestjs/common';
import { CvService } from '../services/cv.service';
import { CvResolver } from '../resolvers/cv.resolver';
import { UserModule } from 'src/modules/users/users.module';
import { CvBuilderFactory } from '../builder/cv-builder.factory';
import { ClassicPdfStrategy } from '../strategies/classic-pdf.strategy';
import { ModernPdfStrategy } from '../strategies/modern-pdf.strategy';

@Module({
  imports: [UserModule],
  providers: [
    CvService,
    CvResolver,
    CvBuilderFactory,
    ClassicPdfStrategy,
    ModernPdfStrategy,
  ],
  exports: [CvService],
})
export class CvModule {}

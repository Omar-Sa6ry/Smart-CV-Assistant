import { Module, forwardRef } from '@nestjs/common';
import { ExportService } from './export.service';
import { ExportResolver } from './export.resolver';
import { ExportController } from './export.controller';
import { ClassicPdfStrategy } from './strategies/classic-pdf.strategy';
import { ModernPdfStrategy } from './strategies/modern-pdf.strategy';
import { WordExportStrategy } from './strategies/word-export.strategy';
import { ModernWordStrategy } from './strategies/modern-word.strategy';
import { CvModule } from '../cv/cv.module';

@Module({
  imports: [
    forwardRef(() => CvModule),
  ],
  controllers: [ExportController],
  providers: [
    ExportService,
    ExportResolver,
    ClassicPdfStrategy,
    ModernPdfStrategy,
    WordExportStrategy,
    ModernWordStrategy,
  ],
  exports: [ExportService],
})
export class ExportModule {}

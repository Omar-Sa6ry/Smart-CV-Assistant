import { Controller, Get, Param, Query, Res, NotFoundException } from '@nestjs/common';
import * as express from 'express';
import { CvService } from '../cv/cv.service';
import { ClassicPdfStrategy } from './strategies/classic-pdf.strategy';
import { ModernPdfStrategy } from './strategies/modern-pdf.strategy';
import { WordExportStrategy } from './strategies/word-export.strategy';
import { ICvExportStrategy } from './strategies/export-strategy.interface';

@Controller('cv-export')
export class ExportController {
  constructor(
    private readonly cvService: CvService,
    private readonly classicStrategy: ClassicPdfStrategy,
    private readonly modernStrategy: ModernPdfStrategy,
    private readonly wordStrategy: WordExportStrategy,
  ) {}

  @Get(':id')
  async export(
    @Param('id') id: string,
    @Query('format') format: string = 'classic',
    @Res() res: express.Response,
  ) {
    const cvResponse = await this.cvService.getById(id);
    if (!cvResponse.data) throw new NotFoundException('CV not found');

    let strategy: ICvExportStrategy;
    if (format === 'modern') strategy = this.modernStrategy;
    else if (format === 'word') strategy = this.wordStrategy;
    else strategy = this.classicStrategy;

    const buffer = await strategy.export(cvResponse.data);

    const contentType = format === 'word' 
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      : 'application/pdf';
    
    const extension = format === 'word' ? 'docx' : 'pdf';
    const fileName = `CV_${id}.${extension}`;

    res.set({
      'Content-Type': contentType,
      'Content-Disposition': `inline; filename="${fileName}"`,
      'Content-Length': (buffer as Buffer).length,
    });

    res.end(buffer);
  }
}

import { Resolver, Query, Args } from '@nestjs/graphql';
import { NotFoundException } from '@nestjs/common';
import { Auth } from 'src/common/decorator/auth.decorator';
import { Permission } from 'src/common/constant/enum.constant';
import { CvService } from '../cv/cv.service';
import { ExportCvResponse } from './dtos/exportCvResponse.dto';
import { ClassicPdfStrategy } from './strategies/classic-pdf.strategy';
import { ModernPdfStrategy } from './strategies/modern-pdf.strategy';
import { WordExportStrategy } from './strategies/word-export.strategy';
import { ModernWordStrategy } from './strategies/modern-word.strategy';
import { ICvExportStrategy } from './strategies/export-strategy.interface';

@Resolver()
export class ExportResolver {
  constructor(
    private readonly cvService: CvService,
    private readonly classicStrategy: ClassicPdfStrategy,
    private readonly modernStrategy: ModernPdfStrategy,
    private readonly wordStrategy: WordExportStrategy,
    private readonly modernWordStrategy: ModernWordStrategy,
  ) {}

  @Query(() => ExportCvResponse)
  @Auth([Permission.GET_USERS_CV])
  async exportCv(
    @Args('id') id: string,
    @Args('format', { type: () => String, defaultValue: 'classic' })
    format: 'classic' | 'modern' | 'word' | 'modern_word',
  ): Promise<ExportCvResponse> {
    const cvResponse = await this.cvService.getById(id);
    if (!cvResponse.data) throw new NotFoundException('CV not found');

    let strategy: ICvExportStrategy;
    if (format === 'modern') strategy = this.modernStrategy;
    else if (format === 'word') strategy = this.wordStrategy;
    else if (format === 'modern_word') strategy = this.modernWordStrategy;
    else strategy = this.classicStrategy;

    const buffer = await strategy.export(cvResponse.data);
    const fileName = `CV_${id}.${(format === 'word' || format === 'modern_word') ? 'docx' : 'pdf'}`;

    return {
      fileContent: (buffer as Buffer).toString('base64'),
      fileName,
      success: true,
      statusCode: 200,
    };
  }
}

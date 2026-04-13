import { Injectable } from '@nestjs/common';
import { ICvExportStrategy } from './export-strategy.interface';

@Injectable()
export class ModernPdfStrategy implements ICvExportStrategy {
  async export(cvData: any): Promise<Buffer | string> {
    return Buffer.from(`Modern PDF: ${cvData.title}`);
  }
}

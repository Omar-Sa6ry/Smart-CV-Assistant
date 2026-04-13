import { Injectable } from '@nestjs/common';
import { ICvExportStrategy } from './export-strategy.interface';

@Injectable()
export class ClassicPdfStrategy implements ICvExportStrategy {
  async export(cvData: any): Promise<Buffer | string> {
    return Buffer.from(`Classic PDF: ${cvData.title}`);
  }
}

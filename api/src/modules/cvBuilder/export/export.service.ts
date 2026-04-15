import { Injectable, InternalServerErrorException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';

@Injectable()
export class ExportService {
  async renderTemplate(template: string, data: any): Promise<string> {
    try {
      const compile = handlebars.compile(template);
      return compile(data);
    } catch (error) {
      throw new InternalServerErrorException(`HTML rendering failed: ${error.message}`);
    }
  }

  async generatePdf(html: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--font-render-hinting=none',
      ],
    });

    try {
      const page = await browser.newPage();
      
      // Set content with a reasonable timeout
      await page.setContent(html, { 
        waitUntil: 'load',
        timeout: 30000 // 30 seconds for safety
      });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '10mm',
          right: '10mm',
          bottom: '10mm',
          left: '10mm',
        },
      });

      await page.close(); // Close page explicitly before browser
      return Buffer.from(pdfBuffer);
    } catch (error) {
      throw new InternalServerErrorException(`PDF generation failed: ${error.message}`);
    } finally {
      if (browser) await browser.close();
    }
  }
}

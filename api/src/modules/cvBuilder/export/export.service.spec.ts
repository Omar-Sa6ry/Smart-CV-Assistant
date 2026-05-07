import { Test, TestingModule } from '@nestjs/testing';
import { ExportService } from './export.service';
import { InternalServerErrorException } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';

jest.mock('puppeteer');
jest.mock('handlebars');

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportService],
    }).compile();

    service = module.get<ExportService>(ExportService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('renderTemplate', () => {
    it('should render template successfully', async () => {
      const template = '<html>{{name}}</html>';
      const data = { name: 'omar' };
      const compiledHtml = '<html>omar</html>';

      const mockCompile = jest.fn().mockReturnValue(compiledHtml);
      (handlebars.compile as jest.Mock).mockReturnValue(mockCompile);

      const result = await service.renderTemplate(template, data);

      expect(result).toBe(compiledHtml);
      expect(handlebars.compile).toHaveBeenCalledWith(template);
      expect(mockCompile).toHaveBeenCalledWith(data);
    });

    it('should throw InternalServerErrorException if rendering fails', async () => {
      const template = 'invalid template';
      const data = {};

      (handlebars.compile as jest.Mock).mockImplementation(() => {
        throw new Error('Handlebars error');
      });

      await expect(service.renderTemplate(template, data)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('generatePdf', () => {
    let mockBrowser: any;
    let mockPage: any;

    beforeEach(() => {
      mockPage = {
        setContent: jest.fn().mockResolvedValue(undefined),
        pdf: jest.fn().mockResolvedValue(Buffer.from('pdf content')),
        close: jest.fn().mockResolvedValue(undefined),
      };

      mockBrowser = {
        newPage: jest.fn().mockResolvedValue(mockPage),
        close: jest.fn().mockResolvedValue(undefined),
      };

      (puppeteer.launch as jest.Mock).mockResolvedValue(mockBrowser);
    });

    it('should generate PDF successfully', async () => {
      const html = '<html><body>Test</body></html>';

      const result = await service.generatePdf(html);

      expect(result).toBeInstanceOf(Buffer);
      expect(result.toString()).toBe('pdf content');
      expect(puppeteer.launch).toHaveBeenCalled();
      expect(mockBrowser.newPage).toHaveBeenCalled();
      expect(mockPage.setContent).toHaveBeenCalledWith(html, expect.any(Object));
      expect(mockPage.pdf).toHaveBeenCalledWith(expect.any(Object));
      expect(mockPage.close).toHaveBeenCalled();
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if puppeteer fails', async () => {
      const html = '<html><body>Test</body></html>';
      mockPage.setContent.mockRejectedValue(new Error('Puppeteer error'));

      await expect(service.generatePdf(html)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should ensure browser is closed even if page.pdf fails', async () => {
      const html = '<html><body>Test</body></html>';
      mockPage.pdf.mockRejectedValue(new Error('PDF generation error'));

      await expect(service.generatePdf(html)).rejects.toThrow(
        InternalServerErrorException,
      );
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('should throw InternalServerErrorException if puppeteer.launch fails', async () => {
      const html = '<html><body>Test</body></html>';
      (puppeteer.launch as jest.Mock).mockRejectedValue(new Error('Launch error'));

      await expect(service.generatePdf(html)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});

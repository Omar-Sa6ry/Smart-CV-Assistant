import { Test, TestingModule } from '@nestjs/testing';
import { ModernPdfStrategy } from './modern-pdf.strategy';
import { ExportService } from '../export.service';

describe('ModernPdfStrategy', () => {
  let strategy: ModernPdfStrategy;
  let exportService: ExportService;

  const mockExportService = {
    renderTemplate: jest.fn().mockImplementation((template, data) => Promise.resolve('<html></html>')),
    generatePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  };

  const mockCvData = {
    user: { firstName: 'John', lastName: 'Doe', email: 'john@doe.com' },
    headline: 'Software Engineer',
    summary: 'A summary with enough characters to test scaling.',
    experiences: [
      {
        jobTitle: 'Developer',
        companyName: 'Tech Co',
        startDate: '2020-01-01',
        endDate: '2022-01-01',
        description: 'Worked on stuff.\nDid more stuff.',
        employmentType: 'full_time',
      },
    ],
    educations: [
      {
        title: 'BSc Computer Science',
        institution: 'University',
        startDate: '2016-01-01',
        endDate: '2020-01-01',
        gpa: '3.8',
      },
    ],
    projects: [
      {
        name: 'Project 1',
        startDate: '2021-01-01',
        description: 'Project description.',
      },
    ],
    skills: [
      { name: 'TypeScript', category: 'programming_language' },
      { name: 'Node.js', category: 'backend' },
    ],
    languages: [{ name: 'English', proficiency: 'fluent' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModernPdfStrategy,
        { provide: ExportService, useValue: mockExportService },
      ],
    }).compile();

    strategy = module.get<ModernPdfStrategy>(ModernPdfStrategy);
    exportService = module.get<ExportService>(ExportService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('export', () => {
    it('should format data correctly and call exportService methods', async () => {
      const result = await strategy.export(mockCvData);

      expect(result).toBeInstanceOf(Buffer);
      expect(exportService.renderTemplate).toHaveBeenCalled();
      expect(exportService.generatePdf).toHaveBeenCalledWith('<html></html>');

      const formattedData = (exportService.renderTemplate as jest.Mock).mock.calls[0][1];
      expect(formattedData.fullName).toBe('John Doe');
      expect(formattedData.experiences[0].employmentTypeDisplay).toBe('(Full Time)');
      expect(formattedData.experiences[0].bullets).toHaveLength(2);
      expect(formattedData.educations[0].gpaDisplay).toBe('GPA: 3.80');
      expect(formattedData.groupedSkills).toContainEqual({
        name: 'Programming Languages',
        items: 'TypeScript',
      });
      expect(formattedData.baseFontSize).toBe('10pt');
    });

    it('should scale down font size for long content', async () => {
      const longCvData = {
        ...mockCvData,
        summary: 'A'.repeat(2600),
      };

      await strategy.export(longCvData);
      const formattedData = (exportService.renderTemplate as jest.Mock).mock.calls[1][1];
      expect(formattedData.baseFontSize).toBe('8.5pt');
    });

    it('should handle missing data gracefully', async () => {
      const minimalData = {
        user: { firstName: 'John' },
      };

      await strategy.export(minimalData);
      const formattedData = (exportService.renderTemplate as jest.Mock).mock.calls[2][1];
      expect(formattedData.fullName).toBe('John');
      expect(formattedData.experiences).toEqual([]);
    });

    it('should handle invalid dates gracefully', async () => {
      const dataWithInvalidDate = {
        ...mockCvData,
        experiences: [{ startDate: 'invalid-date' }],
      };

      await strategy.export(dataWithInvalidDate);
      const formattedData = (exportService.renderTemplate as jest.Mock).mock.calls[3][1];
      expect(formattedData.experiences[0].startDate).toBe('invalid-date');
    });

    it('should format languages proficiency', async () => {
       const data = {
         ...mockCvData,
         languages: [{ name: 'Arabic', proficiency: 'NATIVE' }]
       };
       await strategy.export(data);
       const formattedData = (exportService.renderTemplate as jest.Mock).mock.calls[4][1];
       expect(formattedData.languages[0].proficiency).toBe('Native');
    });
  });
});

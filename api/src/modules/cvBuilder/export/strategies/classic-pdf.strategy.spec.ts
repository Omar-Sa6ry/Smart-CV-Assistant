import { Test, TestingModule } from '@nestjs/testing';
import { ClassicPdfStrategy } from './classic-pdf.strategy';
import { ExportService } from '../export.service';

describe('ClassicPdfStrategy', () => {
  let strategy: ClassicPdfStrategy;
  let exportService: ExportService;

  const mockExportService = {
    renderTemplate: jest.fn().mockImplementation((template, data) => Promise.resolve('<html></html>')),
    generatePdf: jest.fn().mockResolvedValue(Buffer.from('pdf')),
  };

  const mockCvData = {
    user: { firstName: 'John', lastName: 'Doe', email: 'john@doe.com', city: 'Cairo', country: 'Egypt' },
    headline: 'Software Engineer',
    summary: 'Experienced developer.',
    experiences: [
      {
        jobTitle: 'Developer',
        companyName: 'Tech Co',
        startDate: '2020-01-01',
        endDate: '2022-01-01',
        description: 'Bullet 1.\nBullet 2.\nBullet 3.\nBullet 4.\nBullet 5.',
        employmentType: 'full_time',
      },
    ],
    educations: [
      {
        title: 'BSc Computer Science',
        degree: 'Bachelor',
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
    ],
    languages: [{ name: 'English', proficiency: 'FLUENT' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassicPdfStrategy,
        { provide: ExportService, useValue: mockExportService },
      ],
    }).compile();

    strategy = module.get<ClassicPdfStrategy>(ClassicPdfStrategy);
    exportService = module.get<ExportService>(ExportService);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('export', () => {
    it('should format data correctly', async () => {
      await strategy.export(mockCvData);
      const formattedData = (exportService.renderTemplate as jest.Mock).mock.calls[0][1];

      expect(formattedData.location).toBe('Cairo, Egypt');
      expect(formattedData.experiences[0].employmentType).toBe('Full Time');
      expect(formattedData.educations[0].degreeDisplay).toBe('Bachelor');
      expect(formattedData.languages[0].proficiency).toBe('Fluent');
    });

    it('should apply smart truncation when lines exceed limit', async () => {
      const largeCvData = {
        ...mockCvData,
        summary: 'S'.repeat(500),
        experiences: [
          {
            ...mockCvData.experiences[0],
            description: 'Bullet.\n'.repeat(80),
          }
        ]
      };

      await strategy.export(largeCvData);
      const formattedData = (exportService.renderTemplate as jest.Mock).mock.calls[1][1];
      
      expect(formattedData.experiences[0].bullets.length).toBeLessThan(80);
      expect(formattedData.experiences[0].bullets.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle degree display logic correctly', async () => {
        const data = {
            ...mockCvData,
            educations: [
                {
                    title: 'Bachelor of Science',
                    degree: 'Bachelor',
                    institution: 'Uni'
                }
            ]
        };
        await strategy.export(data);
        const formattedData = (exportService.renderTemplate as jest.Mock).mock.calls[2][1];
        expect(formattedData.educations[0].degreeDisplay).toBe(''); 
    });
  });
});

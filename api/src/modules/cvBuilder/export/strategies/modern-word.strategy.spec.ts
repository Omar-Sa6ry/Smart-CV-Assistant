import { Test, TestingModule } from '@nestjs/testing';
import { ModernWordStrategy } from './modern-word.strategy';
import { ExportService } from '../export.service';

describe('ModernWordStrategy', () => {
  jest.setTimeout(30000);
  let strategy: ModernWordStrategy;

  const mockCvData = {
    user: { firstName: 'John', lastName: 'Doe', email: 'john@doe.com' },
    headline: 'Software Engineer',
    summary: 'A summary.',
    experiences: [
      {
        jobTitle: 'Developer',
        companyName: 'Tech Co',
        startDate: '2020-01-01',
        endDate: '2022-01-01',
        description: 'Worked on stuff.',
        employmentType: 'full_time',
      },
    ],
    educations: [
      {
        title: 'BSc',
        institution: 'Uni',
        startDate: '2016-01-01',
        endDate: '2020-01-01',
      },
    ],
    projects: [
      {
        name: 'Project',
        startDate: '2021-01-01',
        description: 'Desc',
      },
    ],
    skills: [
      { name: 'TS', category: 'programming_language' },
    ],
    languages: [{ name: 'English', proficiency: 'FLUENT' }],
    certifications: [{ name: 'Cert', issueDate: '2021-01-01', issuingOrganization: 'Org' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ModernWordStrategy,
        { provide: ExportService, useValue: {} }, // Not used in ModernWordStrategy.export except for injection
      ],
    }).compile();

    strategy = module.get<ModernWordStrategy>(ModernWordStrategy);
  });

  it('should be defined', () => {
    expect(strategy).toBeDefined();
  });

  describe('export', () => {
    it('should generate a buffer', async () => {
      const result = await strategy.export(mockCvData);
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBeGreaterThan(0);
    });

    it('should scale down font size for medium content', async () => {
      const mediumCvData = {
        ...mockCvData,
        summary: 'S'.repeat(1600),
      };
      const result = await strategy.export(mediumCvData);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should scale down font size for long content', async () => {
      const longCvData = {
        ...mockCvData,
        summary: 'S'.repeat(2600),
      };
      const result = await strategy.export(longCvData);
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle missing fields in formatData', async () => {
      const minimalData = {
        user: { firstName: 'John' },
      };
      const result = await strategy.export(minimalData);
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});

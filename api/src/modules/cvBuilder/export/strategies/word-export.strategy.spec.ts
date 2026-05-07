import { Test, TestingModule } from '@nestjs/testing';
import { WordExportStrategy } from './word-export.strategy';

describe('WordExportStrategy', () => {
  jest.setTimeout(30000);
  let strategy: WordExportStrategy;

  const mockCvData = {
    user: { firstName: 'John', lastName: 'Doe', email: 'john@doe.com' },
    headline: 'Software Engineer',
    summary: 'A summary.',
    experiences: [
      {
        jobTitle: 'Developer',
        companyName: 'Tech Co',
        companyWebsite: 'https://tech.co',
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
        gpa: '3.8',
        degree: 'Bachelor'
      },
    ],
    projects: [
      {
        name: 'Project',
        startDate: '2021-01-01',
        description: 'Desc',
        projectUrl: 'https://project.com'
      },
    ],
    skills: [
      { name: 'TS', category: 'programming_language' },
    ],
    languages: [{ name: 'English', proficiency: 'FLUENT' }],
    certifications: [{ name: 'Cert', issueDate: '2021-01-01', issuingOrganization: 'Org', credentialUrl: 'https://cert.com' }],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WordExportStrategy],
    }).compile();

    strategy = module.get<WordExportStrategy>(WordExportStrategy);
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

    it('should apply truncation when lines exceed limit', async () => {
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
  
        const result = await strategy.export(largeCvData);
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

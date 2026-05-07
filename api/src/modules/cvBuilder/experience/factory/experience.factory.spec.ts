import { ExperienceFactory } from './experience.factory';
import { EmploymentType } from '@prisma/client';
import { Experience } from '../models/experience.model';

describe('ExperienceFactory', () => {
  const mockPrismaExperience = {
    id: 'exp-1',
    jobTitle: 'Senior Dev',
    companyName: 'Scale Up',
    companyWebsite: 'https://scaleup.io',
    location: 'Remote',
    startDate: new Date('2021-01-01'),
    endDate: null,
    isCurrentJob: true,
    description: 'Scaling systems',
    employmentType: EmploymentType.full_time,
    userId: 'user-1',
    cvId: 'cv-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('fromPrisma', () => {
    it('should transform prisma experience to experience model', () => {
      const result = ExperienceFactory.fromPrisma(mockPrismaExperience as any);

      expect(result).toBeInstanceOf(Experience);
      expect(result.id).toBe(mockPrismaExperience.id);
      expect(result.jobTitle).toBe(mockPrismaExperience.jobTitle);
      expect(result.companyName).toBe(mockPrismaExperience.companyName);
      expect(result.isCurrentJob).toBe(true);
    });

    it('should handle relations if present', () => {
      const experienceWithRelations = {
        ...mockPrismaExperience,
        user: { id: 'user-1', firstName: 'Omar' },
        cv: { id: 'cv-1', title: 'My CV' },
      };

      const result = ExperienceFactory.fromPrisma(
        experienceWithRelations as any,
      );

      expect(result.id).toBe(mockPrismaExperience.id);
    });
  });

  describe('fromPrismaArray', () => {
    it('should transform an array of prisma experiences', () => {
      const experiences = [
        mockPrismaExperience,
        { ...mockPrismaExperience, id: 'exp-2', jobTitle: 'Junior Dev' },
      ];
      const result = ExperienceFactory.fromPrismaArray(experiences as any);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Experience);
      expect(result[1]).toBeInstanceOf(Experience);
      expect(result[1].jobTitle).toBe('Junior Dev');
    });
  });
});

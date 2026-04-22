import { EducationFactory } from './education.factory';
import { Education } from '../models/education.model';
import { Degree } from '@prisma/client';

describe('EducationFactory', () => {
  const mockPrismaEdu = {
    id: 'edu-1',
    institution: 'University',
    title: 'CS',
    degree: Degree.bachelor,
    gpa: 3.5,
    startDate: new Date('2020-01-01'),
    endDate: new Date('2024-01-01'),
    userId: 'user-1',
    cvId: 'cv-1',
    isCurrent: false,
    location: 'City',
    description: 'Desc',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('fromPrisma', () => {
    it('should map Prisma education correctly', () => {
      const result = EducationFactory.fromPrisma(mockPrismaEdu as any);

      expect(result).toBeInstanceOf(Education);
      expect(result.id).toBe('edu-1');
      expect(result.gpa).toBe(3.5);
    });

    it('should handle null/undefined GPA', () => {
      const eduWithoutGpa = { ...mockPrismaEdu, gpa: null };
      const result = EducationFactory.fromPrisma(eduWithoutGpa as any);
      expect(result.gpa).toBeNull();

      const eduWithUndefinedGpa = { ...mockPrismaEdu, gpa: undefined };
      const result2 = EducationFactory.fromPrisma(eduWithUndefinedGpa as any);
      expect(result2.gpa).toBeNull();
    });

    it('should convert string GPA to number if necessary', () => {
      const eduWithStringGpa = { ...mockPrismaEdu, gpa: '3.9' };
      const result = EducationFactory.fromPrisma(eduWithStringGpa as any);
      expect(result.gpa).toBe(3.9);
    });
  });

  describe('fromPrismaArray', () => {
    it('should map an array of Prisma educations', () => {
      const edus = [
        { id: 'edu-1', institution: 'Uni 1' },
        { id: 'edu-2', institution: 'Uni 2' },
      ];

      const result = EducationFactory.fromPrismaArray(edus as any);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('edu-1');
      expect(result[1].id).toBe('edu-2');
    });
  });
});

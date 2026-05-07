import { AwardFactory } from './award.factory';
import { Award as PrismaAward } from '@prisma/client';
import { Award } from '../models/award.model';

describe('AwardFactory', () => {
  const mockPrismaAward: PrismaAward = {
    id: 'award-1',
    userId: 'user-1',
    cvId: 'cv-1',
    title: 'Employee of the Month',
    issuer: 'Google',
    issueDate: new Date('2024-01-01'),
    description: 'Outstanding performance',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUser = {
    id: 'user-1',
    firstName: 'Omar',
    lastName: 'Sabry',
    email: 'omar@example.com',
  };

  const mockCv = {
    id: 'cv-1',
    userId: 'user-1',
    title: 'Full Stack Developer',
  };

  describe('fromPrisma', () => {
    it('should correctly map a single Prisma award object to Award model', () => {
      const result = AwardFactory.fromPrisma(mockPrismaAward);

      expect(result).toBeInstanceOf(Award);
      expect(result.id).toBe(mockPrismaAward.id);
      expect(result.title).toBe(mockPrismaAward.title);
      expect(result.issuer).toBe(mockPrismaAward.issuer);
      expect(result.issueDate).toEqual(mockPrismaAward.issueDate);
      expect(result.description).toBe(mockPrismaAward.description);
    });

    it('should handle nested relations (User, Cv) if present', () => {
      const prismaAwardWithRelations = {
        ...mockPrismaAward,
        user: mockUser,
        cv: mockCv,
      };

      const result = AwardFactory.fromPrisma(prismaAwardWithRelations as any);

      expect(result.user).toBeDefined();
      expect(result.user?.firstName).toBe(mockUser.firstName);
      expect(result.cv).toBeDefined();
      expect(result.cv?.id).toBe(mockCv.id);
    });

    it('should work without optional relations', () => {
      const result = AwardFactory.fromPrisma(mockPrismaAward);
      expect(result.user).toBeUndefined();
      expect(result.cv).toBeUndefined();
    });
  });

  describe('fromPrismaArray', () => {
    it('should map arrays of objects correctly', () => {
      const prismaAwards = [mockPrismaAward, { ...mockPrismaAward, id: 'award-2' }];
      const result = AwardFactory.fromPrismaArray(prismaAwards);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].id).toBe('award-1');
      expect(result[1].id).toBe('award-2');
    });
  });
});

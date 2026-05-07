import { SkillFactory } from './skill.factory';
import { SkillProficiency, SkillCategory } from '@prisma/client';
import { Skill } from '../models/skill.model';
import { SkillKeyword } from '../models/skill-keyword.model';

describe('SkillFactory', () => {
  const mockPrismaSkill = {
    id: 'skill-id',
    userId: 'user-id',
    cvId: 'cv-id',
    keywordId: 'kw-id',
    name: 'TypeScript',
    category: SkillCategory.technical,
    proficiency: SkillProficiency.expert,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrismaKeyword = {
    id: 'kw-id',
    name: 'TypeScript',
    category: SkillCategory.technical,
    popularityScore: 100,
    isVerified: true,
    createdAt: new Date(),
  };

  describe('fromPrisma', () => {
    it('should transform prisma skill to skill model', () => {
      const result = SkillFactory.fromPrisma(mockPrismaSkill);

      expect(result).toBeInstanceOf(Skill);
      expect(result.id).toBe(mockPrismaSkill.id);
      expect(result.name).toBe(mockPrismaSkill.name);
      expect(result.proficiency).toBe(mockPrismaSkill.proficiency);
    });

    it('should include relations if provided', () => {
      const skillWithRelations = {
        ...mockPrismaSkill,
        user: { id: 'user-id', email: 'test@test.com' },
        keyword: mockPrismaKeyword,
      };

      const result = SkillFactory.fromPrisma(skillWithRelations as any);

      expect(result.user).toBeDefined();
      expect(result.keyword).toBeDefined();
      expect(result.keyword?.name).toBe('TypeScript');
    });
  });

  describe('fromPrismaArray', () => {
    it('should transform array of prisma skills', () => {
      const skills = [mockPrismaSkill, { ...mockPrismaSkill, id: 'skill-2' }];
      const result = SkillFactory.fromPrismaArray(skills);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(Skill);
      expect(result[1].id).toBe('skill-2');
    });
  });

  describe('keywordFromPrisma', () => {
    it('should transform prisma keyword to keyword model', () => {
      const result = SkillFactory.keywordFromPrisma(mockPrismaKeyword);

      expect(result).toBeInstanceOf(SkillKeyword);
      expect(result.id).toBe(mockPrismaKeyword.id);
      expect(result.name).toBe(mockPrismaKeyword.name);
      expect(result.isVerified).toBe(true);
    });
  });

  describe('keywordFromPrismaArray', () => {
    it('should transform array of prisma keywords', () => {
      const keywords = [mockPrismaKeyword, { ...mockPrismaKeyword, id: 'kw-2' }];
      const result = SkillFactory.keywordFromPrismaArray(keywords);

      expect(result).toHaveLength(2);
      expect(result[0]).toBeInstanceOf(SkillKeyword);
      expect(result[1].id).toBe('kw-2');
    });
  });
});

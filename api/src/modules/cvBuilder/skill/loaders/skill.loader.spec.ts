import { Test, TestingModule } from '@nestjs/testing';
import { SkillLoader } from './skill.loader';
import { PrismaService } from 'src/common/database/prisma.service';
import { SkillFactory } from '../factory/skill.factory';

describe('SkillLoader', () => {
  let loader: SkillLoader;
  let prisma: PrismaService;

  const mockPrisma = {
    user: { findMany: jest.fn() },
    cv: { findMany: jest.fn() },
    skillKeyword: { findMany: jest.fn() },
    skill: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillLoader,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    loader = await module.resolve<SkillLoader>(SkillLoader);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('userLoader', () => {
    it('should load users in the correct order', async () => {
      const userIds = ['user-1', 'user-2'];
      const users = [
        { id: 'user-2', email: 'user2@test.com' },
        { id: 'user-1', email: 'user1@test.com' },
      ];
      mockPrisma.user.findMany.mockResolvedValueOnce(users);

      const result = await loader.userLoader.loadMany(userIds);

      expect(result[0]).toEqual(users[1]);
      expect(result[1]).toEqual(users[0]);
    });

    it('should return undefined for missing users', async () => {
      mockPrisma.user.findMany.mockResolvedValueOnce([]);
      const result = await loader.userLoader.load('missing');
      expect(result).toBeUndefined();
    });
  });

  describe('cvLoader', () => {
    it('should load cvs in the correct order', async () => {
      const cvIds = ['cv-1', 'cv-2'];
      const cvs = [
        { id: 'cv-2', title: 'CV 2' },
        { id: 'cv-1', title: 'CV 1' },
      ];
      mockPrisma.cv.findMany.mockResolvedValueOnce(cvs);

      const result = await loader.cvLoader.loadMany(cvIds);

      expect(result[0]).toEqual(cvs[1]);
      expect(result[1]).toEqual(cvs[0]);
    });
  });

  describe('keywordLoader', () => {
    it('should load keywords in the correct order', async () => {
      const keywordIds = ['kw-1', 'kw-2'];
      const keywords = [
        { id: 'kw-2', name: 'Node.js' },
        { id: 'kw-1', name: 'TypeScript' },
      ];
      mockPrisma.skillKeyword.findMany.mockResolvedValueOnce(keywords);

      const result = await loader.keywordLoader.loadMany(keywordIds);

      expect(result[0].name).toBe('TypeScript');
      expect(result[1].name).toBe('Node.js');
    });

    it('should handle empty string ids', async () => {
      mockPrisma.skillKeyword.findMany.mockResolvedValueOnce([]);
      const result = await loader.keywordLoader.loadMany(['']);
      expect(result[0]).toBeNull();
    });
  });

  describe('skillsByCvIdLoader', () => {
    it('should load skills grouped by cvId', async () => {
      const cvIds = ['cv-1', 'cv-2'];
      const skills = [
        { id: 's-1', cvId: 'cv-1', name: 'Skill 1' },
        { id: 's-2', cvId: 'cv-1', name: 'Skill 2' },
        { id: 's-3', cvId: 'cv-2', name: 'Skill 3' },
      ];
      mockPrisma.skill.findMany.mockResolvedValueOnce(skills);

      const result = await loader.skillsByCvIdLoader.loadMany(cvIds);

      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(1);
      expect((result[0] as any)[0].id).toBe('s-1');
      expect((result[1] as any)[0].id).toBe('s-3');
    });

    it('should return empty array for cvId with no skills', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([]);
      const result = await loader.skillsByCvIdLoader.load('empty-cv');
      expect(result).toEqual([]);
    });
  });
});

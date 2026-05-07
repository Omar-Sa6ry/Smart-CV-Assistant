import { Test, TestingModule } from '@nestjs/testing';
import { LanguageLoader } from './language.loader';
import { PrismaService } from 'src/common/database/prisma.service';
import { Proficiency } from '@prisma/client';

describe('LanguageLoader', () => {
  let loader: LanguageLoader;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
    },
    cv: {
      findMany: jest.fn(),
    },
    language: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LanguageLoader,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    loader = await module.resolve<LanguageLoader>(LanguageLoader);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('userLoader', () => {
    it('should load users by ids and return them in correct order', async () => {
      const userIds = ['u1', 'u2'];
      const mockUsers = [
        { id: 'u2', firstName: 'User 2' },
        { id: 'u1', firstName: 'User 1' },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(mockUsers);

      const result = await loader.userLoader.loadMany(userIds);

      expect(result[0]).toEqual(mockUsers[1]);
      expect(result[1]).toEqual(mockUsers[0]);
    });
  });

  describe('cvLoader', () => {
    it('should load cvs by ids and return them in correct order', async () => {
      const cvIds = ['c1', 'c2'];
      const mockCvs = [
        { id: 'c2', title: 'CV 2' },
        { id: 'c1', title: 'CV 1' },
      ];
      (prisma.cv.findMany as jest.Mock).mockResolvedValue(mockCvs);

      const result = await loader.cvLoader.loadMany(cvIds);

      expect(result[0]).toEqual(mockCvs[1]);
      expect(result[1]).toEqual(mockCvs[0]);
    });
  });

  describe('languagesByCvIdLoader', () => {
    it('should load languages grouped by cvId', async () => {
      const cvIds = ['c1', 'c2'];
      const mockLanguages = [
        { id: 'l1', cvId: 'c1', name: 'English' },
        { id: 'l2', cvId: 'c1', name: 'Arabic' },
        { id: 'l3', cvId: 'c2', name: 'French' },
      ];
      (prisma.language.findMany as jest.Mock).mockResolvedValue(mockLanguages);

      const result = await loader.languagesByCvIdLoader.loadMany(cvIds);

      expect(result[0]).toHaveLength(2);
      expect(result[0][0].name).toBe('English');
      expect(result[0][1].name).toBe('Arabic');
      expect(result[1]).toHaveLength(1);
      expect(result[1][0].name).toBe('French');
    });

    it('should return empty array for cvId with no languages', async () => {
      const cvIds = ['c1'];
      (prisma.language.findMany as jest.Mock).mockResolvedValue([]);

      const result = await loader.languagesByCvIdLoader.loadMany(cvIds);

      expect(result[0]).toEqual([]);
    });
  });
});

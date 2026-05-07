import { Test, TestingModule } from '@nestjs/testing';
import { ExperienceLoader } from './experience.loader';
import { PrismaService } from 'src/common/database/prisma.service';

describe('ExperienceLoader', () => {
  let loader: ExperienceLoader;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
    },
    cv: {
      findMany: jest.fn(),
    },
    experience: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperienceLoader,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    loader = await module.resolve<ExperienceLoader>(ExperienceLoader);
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

  describe('experiencesByCvIdLoader', () => {
    it('should load experiences grouped by cvId and ordered by startDate desc', async () => {
      const cvIds = ['c1', 'c2'];
      const mockExperiences = [
        { id: 'e1', cvId: 'c1', jobTitle: 'Exp 1', startDate: new Date('2022-01-01') },
        { id: 'e2', cvId: 'c1', jobTitle: 'Exp 2', startDate: new Date('2021-01-01') },
        { id: 'e3', cvId: 'c2', jobTitle: 'Exp 3', startDate: new Date('2023-01-01') },
      ];
      (prisma.experience.findMany as jest.Mock).mockResolvedValue(mockExperiences);

      const result = await loader.experiencesByCvIdLoader.loadMany(cvIds);

      expect(result[0]).toHaveLength(2);
      expect(result[0][0].jobTitle).toBe('Exp 1');
      expect(result[0][1].jobTitle).toBe('Exp 2');
      expect(result[1]).toHaveLength(1);
      expect(result[1][0].jobTitle).toBe('Exp 3');
      
      expect(prisma.experience.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { startDate: 'desc' },
      }));
    });

    it('should return empty array for cvId with no experiences', async () => {
      const cvIds = ['c1'];
      (prisma.experience.findMany as jest.Mock).mockResolvedValue([]);

      const result = await loader.experiencesByCvIdLoader.loadMany(cvIds);

      expect(result[0]).toEqual([]);
    });
  });
});

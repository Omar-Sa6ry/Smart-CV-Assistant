import { Test, TestingModule } from '@nestjs/testing';
import { ProjectLoader } from './project.loader';
import { PrismaService } from 'src/common/database/prisma.service';

describe('ProjectLoader', () => {
  let loader: ProjectLoader;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findMany: jest.fn(),
    },
    cv: {
      findMany: jest.fn(),
    },
    project: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectLoader,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    loader = await module.resolve<ProjectLoader>(ProjectLoader);
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

  describe('projectsByCvIdLoader', () => {
    it('should load projects grouped by cvId and ordered by startDate desc', async () => {
      const cvIds = ['c1', 'c2'];
      const mockProjects = [
        { id: 'p1', cvId: 'c1', name: 'Proj 1', startDate: new Date('2022-01-01') },
        { id: 'p2', cvId: 'c1', name: 'Proj 2', startDate: new Date('2021-01-01') },
        { id: 'p3', cvId: 'c2', name: 'Proj 3', startDate: new Date('2023-01-01') },
      ];
      (prisma.project.findMany as jest.Mock).mockResolvedValue(mockProjects);

      const result = await loader.projectsByCvIdLoader.loadMany(cvIds);

      expect(result[0]).toHaveLength(2);
      expect(result[0][0].name).toBe('Proj 1');
      expect(result[0][1].name).toBe('Proj 2');
      expect(result[1]).toHaveLength(1);
      expect(result[1][0].name).toBe('Proj 3');
      
      expect(prisma.project.findMany).toHaveBeenCalledWith(expect.objectContaining({
        orderBy: { startDate: 'desc' },
      }));
    });

    it('should return empty array for cvId with no projects', async () => {
      const cvIds = ['c1'];
      (prisma.project.findMany as jest.Mock).mockResolvedValue([]);

      const result = await loader.projectsByCvIdLoader.loadMany(cvIds);

      expect(result[0]).toEqual([]);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { AwardLoader } from './award.loader';
import { PrismaService } from 'src/common/database/prisma.service';
import { AwardFactory } from '../factory/award.factory';

jest.mock('../factory/award.factory');

describe('AwardLoader', () => {
  let loader: AwardLoader;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwardLoader,
        {
          provide: PrismaService,
          useValue: {
            user: { findMany: jest.fn() },
            cv: { findMany: jest.fn() },
            award: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    loader = await module.resolve<AwardLoader>(AwardLoader);
    prisma = module.get(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('userLoader', () => {
    it('should batch and load users while preserving order', async () => {
      const userIds = ['u1', 'u2', 'u3'];
      const users = [
        { id: 'u2', email: 'u2@test.com' },
        { id: 'u1', email: 'u1@test.com' },
      ];
      (prisma.user.findMany as jest.Mock).mockResolvedValue(users);

      const result = await loader.userLoader.loadMany(userIds);

      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: userIds } },
      });
      expect(result[0]).toEqual(users[1]);
      expect(result[1]).toEqual(users[0]);
      expect(result[2]).toBeUndefined();
    });
  });

  describe('cvLoader', () => {
    it('should batch and load CVs while preserving order', async () => {
      const cvIds = ['cv1', 'cv2'];
      const cvs = [{ id: 'cv2', title: 'CV 2' }];
      (prisma.cv.findMany as jest.Mock).mockResolvedValue(cvs);

      const result = await loader.cvLoader.loadMany(cvIds);

      expect(prisma.cv.findMany).toHaveBeenCalledWith({
        where: { id: { in: cvIds } },
      });
      expect(result[0]).toBeUndefined();
      expect(result[1]).toEqual(cvs[0]);
    });
  });

  describe('awardsByCvIdLoader', () => {
    it('should batch and load awards by CV IDs while preserving order', async () => {
      const cvIds = ['cv1', 'cv2', 'cv3'];
      const prismaAwards = [
        { id: 'aw1', cvId: 'cv1', title: 'Award 1' },
        { id: 'aw2', cvId: 'cv1', title: 'Award 2' },
        { id: 'aw3', cvId: 'cv3', title: 'Award 3' },
      ];
      (prisma.award.findMany as jest.Mock).mockResolvedValue(prismaAwards);

      (AwardFactory.fromPrisma as jest.Mock).mockImplementation((aw) => aw);

      const result = await loader.awardsByCvIdLoader.loadMany(cvIds);

      expect(prisma.award.findMany).toHaveBeenCalledWith({
        where: { cvId: { in: cvIds } },
        orderBy: { issueDate: 'desc' },
      });

      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(0);
      expect(result[2]).toHaveLength(1);
      expect(result[0][0].id).toBe('aw1');
      expect(result[0][1].id).toBe('aw2');
      expect(result[2][0].id).toBe('aw3');
    });
  });
});

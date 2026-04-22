import { Test, TestingModule } from '@nestjs/testing';
import { EducationLoader } from './education.loader';
import { PrismaService } from 'src/common/database/prisma.service';
import { EducationFactory } from '../factory/education.factory';

jest.mock('../factory/education.factory');

describe('EducationLoader', () => {
  let loader: EducationLoader;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EducationLoader,
        {
          provide: PrismaService,
          useValue: {
            user: { findMany: jest.fn() },
            cv: { findMany: jest.fn() },
            education: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    loader = await module.resolve<EducationLoader>(EducationLoader);
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

  describe('educationsByCvIdLoader', () => {
    it('should batch and load educations by CV IDs while preserving order', async () => {
      const cvIds = ['cv1', 'cv2', 'cv3'];
      const prismaEducations = [
        { id: 'edu1', cvId: 'cv1', institution: 'Univ 1' },
        { id: 'edu2', cvId: 'cv1', institution: 'Univ 2' },
        { id: 'edu3', cvId: 'cv3', institution: 'Univ 3' },
      ];
      (prisma.education.findMany as jest.Mock).mockResolvedValue(prismaEducations);

      (EducationFactory.fromPrisma as jest.Mock).mockImplementation((edu) => edu);

      const result = await loader.educationsByCvIdLoader.loadMany(cvIds);

      expect(prisma.education.findMany).toHaveBeenCalledWith({
        where: { cvId: { in: cvIds } },
        orderBy: { startDate: 'desc' },
      });

      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(0);
      expect(result[2]).toHaveLength(1);
      expect(result[0][0].id).toBe('edu1');
      expect(result[2][0].id).toBe('edu3');
    });
  });
});

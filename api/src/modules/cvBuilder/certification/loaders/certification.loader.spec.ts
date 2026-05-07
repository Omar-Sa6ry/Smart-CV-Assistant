import { Test, TestingModule } from '@nestjs/testing';
import { CertificationLoader } from './certification.loader';
import { PrismaService } from 'src/common/database/prisma.service';
import { CertificationFactory } from '../factory/certification.factory';

jest.mock('../factory/certification.factory');

describe('CertificationLoader', () => {
  let loader: CertificationLoader;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationLoader,
        {
          provide: PrismaService,
          useValue: {
            user: { findMany: jest.fn() },
            cv: { findMany: jest.fn() },
            certification: { findMany: jest.fn() },
          },
        },
      ],
    }).compile();

    loader = await module.resolve<CertificationLoader>(CertificationLoader);
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

  describe('certsByCvIdLoader', () => {
    it('should batch and load certifications by CV IDs while preserving order', async () => {
      const cvIds = ['cv1', 'cv2', 'cv3'];
      const prismaCerts = [
        { id: 'cert1', cvId: 'cv1', name: 'Cert 1' },
        { id: 'cert2', cvId: 'cv1', name: 'Cert 2' },
        { id: 'cert3', cvId: 'cv3', name: 'Cert 3' },
      ];
      (prisma.certification.findMany as jest.Mock).mockResolvedValue(
        prismaCerts,
      );

      (CertificationFactory.fromPrisma as jest.Mock).mockImplementation(
        (cert) => cert,
      );

      const result = await loader.certsByCvIdLoader.loadMany(cvIds);

      expect(prisma.certification.findMany).toHaveBeenCalledWith({
        where: { cvId: { in: cvIds } },
        orderBy: { issueDate: 'desc' },
      });

      expect(result[0]).toHaveLength(2);
      expect(result[1]).toHaveLength(0);
      expect(result[2]).toHaveLength(1);
      expect(result[0][0].id).toBe('cert1');
      expect(result[2][0].id).toBe('cert3');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CertificationService } from './certification.service';
import { PrismaService } from 'src/common/database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CvService } from '../cv/cv.service';
import { CertificationBuilderFactory } from './builder/certification-builder.factory';
import { CertificationFactory } from './factory/certification.factory';
import { BadRequestException, NotFoundException } from '@nestjs/common';

jest.mock('./factory/certification.factory');

describe('CertificationService', () => {
  let service: CertificationService;
  let prisma: jest.Mocked<PrismaService>;
  let i18n: jest.Mocked<I18nService>;
  let cvService: jest.Mocked<CvService>;
  let builderFactory: jest.Mocked<CertificationBuilderFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CertificationService,
        {
          provide: PrismaService,
          useValue: {
            certification: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: I18nService,
          useValue: {
            t: jest.fn(),
          },
        },
        {
          provide: CvService,
          useValue: {
            getById: jest.fn(),
            invalidateCache: jest.fn(),
          },
        },
        {
          provide: CertificationBuilderFactory,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CertificationService>(CertificationService);
    prisma = module.get(PrismaService);
    i18n = module.get(I18nService);
    cvService = module.get(CvService);
    builderFactory = module.get(CertificationBuilderFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCertification', () => {
    const userId = 'user-1';
    const createDto = {
      name: 'AWS Certified',
      issuingOrganization: 'Amazon',
      cvId: 'cv-1',
      issueDate: '2023-01-01',
    };

    it('should throw BadRequestException for invalid date', async () => {
      cvService.getById.mockResolvedValue({ data: {} } as any);
      await expect(
        service.createCertification(userId, { ...createDto, issueDate: 'invalid-date' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should create certification successfully', async () => {
      cvService.getById.mockResolvedValue({ data: { id: 'cv-1' } } as any);
      
      const builderMock = {
        setName: jest.fn().mockReturnThis(),
        setIssuingOrganization: jest.fn().mockReturnThis(),
        setCredentialId: jest.fn().mockReturnThis(),
        setCredentialUrl: jest.fn().mockReturnThis(),
        setIssueDate: jest.fn().mockReturnThis(),
        setUser: jest.fn().mockReturnThis(),
        setCv: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({ ...createDto, userId }),
      };
      builderFactory.create.mockReturnValue(builderMock as any);

      const createdCert = { id: 'cert-1', ...createDto, userId };
      prisma.certification.create.mockResolvedValue(createdCert as any);
      (CertificationFactory.fromPrisma as jest.Mock).mockReturnValue(createdCert);
      i18n.t.mockResolvedValue('Created');

      const result = await service.createCertification(userId, createDto as any);

      expect(result.data).toEqual(createdCert);
      expect(cvService.getById).toHaveBeenCalledTimes(2);
      expect(cvService.invalidateCache).toHaveBeenCalled();
    });
  });

  describe('getCertificationsByCvId', () => {
    it('should return paginated certifications', async () => {
      const userId = 'user-1';
      const cvId = 'cv-1';
      const certs = [{ id: 'cert-1' }];
      prisma.$transaction.mockResolvedValue([certs, 1]);
      (CertificationFactory.fromPrismaArray as jest.Mock).mockReturnValue(certs);

      const result = await service.getCertificationsByCvId(userId, cvId, { page: 1, limit: 5 });

      expect(result.items).toEqual(certs);
      expect(result.pagination.totalItems).toBe(1);
    });
  });

  describe('getCertificationsByUserId', () => {
    it('should return certifications for user', async () => {
      const userId = 'user-1';
      prisma.$transaction.mockResolvedValue([[], 0]);
      await service.getCertificationsByUserId(userId);
      expect(prisma.certification.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId },
      }));
    });
  });

  describe('getCertificationById', () => {
    it('should throw NotFoundException if not found or unauthorized', async () => {
      prisma.certification.findUnique.mockResolvedValue(null);
      i18n.t.mockResolvedValue('Not found');

      await expect(service.getCertificationById('user-1', 'cert-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if userId mismatch', async () => {
      prisma.certification.findUnique.mockResolvedValue({ id: 'cert-1', userId: 'other' } as any);
      i18n.t.mockResolvedValue('Not found');

      await expect(service.getCertificationById('user-1', 'cert-1')).rejects.toThrow(NotFoundException);
    });

    it('should return certification', async () => {
      const cert = { id: 'cert-1', userId: 'user-1' };
      prisma.certification.findUnique.mockResolvedValue(cert as any);
      (CertificationFactory.fromPrisma as jest.Mock).mockReturnValue(cert);

      const result = await service.getCertificationById('user-1', 'cert-1');
      expect(result.data).toEqual(cert);
    });
  });

  describe('updateCertification', () => {
    it('should update and invalidate cache', async () => {
      const userId = 'user-1';
      const id = 'cert-1';
      const updateDto = { name: 'New Name' };
      const existing = { id, userId, cvId: 'cv-1' };
      
      prisma.certification.findUnique.mockResolvedValue(existing as any);
      prisma.certification.update.mockResolvedValue({ ...existing, ...updateDto } as any);
      cvService.getById.mockResolvedValue({ data: {} } as any);
      (CertificationFactory.fromPrisma as jest.Mock).mockReturnValue({ ...existing, ...updateDto });

      await service.updateCertification(userId, id, updateDto as any);

      expect(prisma.certification.update).toHaveBeenCalled();
      expect(cvService.invalidateCache).toHaveBeenCalled();
    });
  });

  describe('deleteCertification', () => {
    it('should delete and invalidate cache', async () => {
      const userId = 'user-1';
      const id = 'cert-1';
      const existing = { id, userId, cvId: 'cv-1' };
      
      prisma.certification.findUnique.mockResolvedValue(existing as any);
      (CertificationFactory.fromPrisma as jest.Mock).mockReturnValue(existing);
      cvService.getById.mockResolvedValue({ data: {} } as any);
      i18n.t.mockResolvedValue('Deleted');

      const result = await service.deleteCertification(userId, id);

      expect(prisma.certification.delete).toHaveBeenCalledWith({ where: { id } });
      expect(cvService.invalidateCache).toHaveBeenCalled();
      expect(result.message).toBe('Deleted');
    });
  });
});

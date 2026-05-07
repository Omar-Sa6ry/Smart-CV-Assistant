import { Test, TestingModule } from '@nestjs/testing';
import { EducationService } from './education.service';
import { PrismaService } from 'src/common/database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CvService } from '../cv/cv.service';
import { EducationBuilderFactory } from './builder/education-builder.factory';
import { EducationFactory } from './factory/education.factory';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Degree } from '@prisma/client';

jest.mock('./factory/education.factory');

describe('EducationService', () => {
  let service: EducationService;
  let prisma: jest.Mocked<PrismaService>;
  let i18n: jest.Mocked<I18nService>;
  let cvService: jest.Mocked<CvService>;
  let builderFactory: jest.Mocked<EducationBuilderFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EducationService,
        {
          provide: PrismaService,
          useValue: {
            education: {
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
          provide: EducationBuilderFactory,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<EducationService>(EducationService);
    prisma = module.get(PrismaService);
    i18n = module.get(I18nService);
    cvService = module.get(CvService);
    builderFactory = module.get(EducationBuilderFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createEducation', () => {
    const userId = 'user-1';
    const createDto = {
      institution: 'MIT',
      title: 'CS',
      degree: Degree.bachelor,
      cvId: 'cv-1',
      startDate: new Date(),
    };

    it('should create education successfully', async () => {
      cvService.getById.mockResolvedValue({ data: { id: 'cv-1' } } as any);
      
      const builderMock = {
        setInstitution: jest.fn().mockReturnThis(),
        setTitle: jest.fn().mockReturnThis(),
        setLocation: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setDegree: jest.fn().mockReturnThis(),
        setGpa: jest.fn().mockReturnThis(),
        setIsCurrent: jest.fn().mockReturnThis(),
        setStartDate: jest.fn().mockReturnThis(),
        setEndDate: jest.fn().mockReturnThis(),
        setUser: jest.fn().mockReturnThis(),
        setCv: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({ ...createDto, userId }),
      };
      builderFactory.create.mockReturnValue(builderMock as any);

      const createdEdu = { id: 'edu-1', ...createDto, userId };
      prisma.education.create.mockResolvedValue(createdEdu as any);
      (EducationFactory.fromPrisma as jest.Mock).mockReturnValue(createdEdu);
      i18n.t.mockResolvedValue('Created');

      const result = await service.createEducation(userId, createDto as any);

      expect(result.data).toEqual(createdEdu);
      expect(cvService.getById).toHaveBeenCalledWith(createDto.cvId, userId);
      expect(cvService.invalidateCache).toHaveBeenCalled();
    });
  });

  describe('getEducationsByUserId', () => {
    it('should return paginated educations with custom pagination', async () => {
      const userId = 'user-1';
      const edus = [{ id: 'edu-1' }];
      prisma.$transaction.mockResolvedValue([edus, 1]);
      (EducationFactory.fromPrismaArray as jest.Mock).mockReturnValue(edus);

      const result = await service.getEducationsByUserId(userId, { page: 2, limit: 5 });

      expect(result.items).toEqual(edus);
      expect(result.pagination.currentPage).toBe(2);
      expect(prisma.education.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 5,
        take: 5,
      }));
    });

    it('should use default pagination if not provided', async () => {
      const userId = 'user-1';
      prisma.$transaction.mockResolvedValue([[], 0]);
      await service.getEducationsByUserId(userId);
      expect(prisma.education.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
      }));
    });
  });

  describe('getEducationsByCvId', () => {
    it('should use default pagination for CV educations', async () => {
      const userId = 'user-1';
      const cvId = 'cv-1';
      prisma.$transaction.mockResolvedValue([[], 0]);
      await service.getEducationsByCvId(userId, cvId);
      expect(prisma.education.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
      }));
    });
  });

  describe('getEducationById', () => {
    it('should throw ForbiddenException if not found', async () => {
      prisma.education.findUnique.mockResolvedValue(null);
      i18n.t.mockResolvedValue('No Permission');

      await expect(service.getEducationById('u1', 'e1')).rejects.toThrow(ForbiddenException);
    });

    it('should throw ForbiddenException if userId mismatch', async () => {
      prisma.education.findUnique.mockResolvedValue({ id: 'e1', userId: 'other' } as any);
      i18n.t.mockResolvedValue('No Permission');

      await expect(service.getEducationById('u1', 'e1')).rejects.toThrow(ForbiddenException);
    });

    it('should return education if owner', async () => {
      const edu = { id: 'e1', userId: 'u1' };
      prisma.education.findUnique.mockResolvedValue(edu as any);
      (EducationFactory.fromPrisma as jest.Mock).mockReturnValue(edu);

      const result = await service.getEducationById('u1', 'e1');
      expect(result.data).toEqual(edu);
    });
  });

  describe('updateEducation', () => {
    it('should update and handle optional cvId', async () => {
      const existing = { id: 'e1', userId: 'u1', cvId: 'cv1' };
      prisma.education.findUnique.mockResolvedValue(existing as any);
      prisma.education.update.mockResolvedValue({ ...existing, title: 'New' } as any);
      cvService.getById.mockResolvedValue({ data: {} } as any);
      (EducationFactory.fromPrisma as jest.Mock).mockReturnValue({ ...existing, title: 'New' });

      await service.updateEducation('u1', 'e1', { title: 'New', cvId: 'cv2' });

      expect(cvService.getById).toHaveBeenCalledWith('cv2', 'u1');
      expect(cvService.invalidateCache).toHaveBeenCalled();
    });
  });

  describe('deleteEducation', () => {
    it('should delete and update cache', async () => {
      const existing = { id: 'e1', userId: 'u1', cvId: 'cv1' };
      prisma.education.findUnique.mockResolvedValue(existing as any);
      (EducationFactory.fromPrisma as jest.Mock).mockReturnValue(existing);
      cvService.getById.mockResolvedValue({ data: {} } as any);
      i18n.t.mockResolvedValue('Deleted');

      const result = await service.deleteEducation('u1', 'e1');

      expect(prisma.education.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
      expect(cvService.invalidateCache).toHaveBeenCalled();
      expect(result.message).toBe('Deleted');
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { ExperienceService } from './experience.service';
import { PrismaService } from 'src/common/database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CvService } from '../cv/cv.service';
import { ExperienceBuilderFactory } from './builder/experience-builder.factory';
import { ExperienceFactory } from './factory/experience.factory';
import { NotFoundException } from '@nestjs/common';
import { EmploymentType } from '@prisma/client';

jest.mock('./factory/experience.factory');

describe('ExperienceService', () => {
  let service: ExperienceService;
  let prisma: jest.Mocked<PrismaService>;
  let i18n: jest.Mocked<I18nService>;
  let cvService: jest.Mocked<CvService>;
  let builderFactory: jest.Mocked<ExperienceBuilderFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExperienceService,
        {
          provide: PrismaService,
          useValue: {
            experience: {
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
          provide: ExperienceBuilderFactory,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ExperienceService>(ExperienceService);
    prisma = module.get(PrismaService);
    i18n = module.get(I18nService);
    cvService = module.get(CvService);
    builderFactory = module.get(ExperienceBuilderFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createExperience', () => {
    const userId = 'user-1';
    const createDto = {
      jobTitle: 'Software Engineer',
      companyName: 'Tech Co',
      cvId: 'cv-1',
      startDate: new Date(),
      employmentType: EmploymentType.full_time,
    };

    it('should create experience successfully', async () => {
      cvService.getById.mockResolvedValue({ data: { id: 'cv-1' } } as any);
      
      const builderMock = {
        setJobTitle: jest.fn().mockReturnThis(),
        setCompanyName: jest.fn().mockReturnThis(),
        setCompanyWebsite: jest.fn().mockReturnThis(),
        setLocation: jest.fn().mockReturnThis(),
        setStartDate: jest.fn().mockReturnThis(),
        setEndDate: jest.fn().mockReturnThis(),
        setIsCurrentJob: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setEmploymentType: jest.fn().mockReturnThis(),
        setUser: jest.fn().mockReturnThis(),
        setCv: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({ ...createDto, userId }),
      };
      builderFactory.create.mockReturnValue(builderMock as any);

      const createdExp = { id: 'exp-1', ...createDto, userId };
      prisma.experience.create.mockResolvedValue(createdExp as any);
      (ExperienceFactory.fromPrisma as jest.Mock).mockReturnValue(createdExp);
      i18n.t.mockResolvedValue('Created');

      const result = await service.createExperience(userId, createDto as any);

      expect(result.data).toEqual(createdExp);
      expect(cvService.getById).toHaveBeenCalledWith(createDto.cvId, userId);
      expect(cvService.invalidateCache).toHaveBeenCalled();
    });
  });

  describe('getExperiencesByUserId', () => {
    it('should return paginated experiences', async () => {
      const userId = 'user-1';
      const exps = [{ id: 'exp-1' }];
      prisma.$transaction.mockResolvedValue([exps, 1]);
      (ExperienceFactory.fromPrismaArray as jest.Mock).mockReturnValue(exps);

      const result = await service.getExperiencesByUserId(userId, { page: 1, limit: 10 });

      expect(result.items).toEqual(exps);
      expect(result.pagination.totalItems).toBe(1);
      expect(prisma.experience.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId },
        skip: 0,
        take: 10,
      }));
    });
  });

  describe('getExperiencesByCvId', () => {
    it('should return paginated experiences for a CV', async () => {
      const userId = 'user-1';
      const cvId = 'cv-1';
      const exps = [{ id: 'exp-1' }];
      prisma.$transaction.mockResolvedValue([exps, 1]);
      (ExperienceFactory.fromPrismaArray as jest.Mock).mockReturnValue(exps);

      const result = await service.getExperiencesByCvId(userId, cvId);

      expect(result.items).toEqual(exps);
      expect(prisma.experience.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { cvId, userId },
      }));
    });
  });

  describe('getExperienceById', () => {
    it('should throw NotFoundException if experience not found', async () => {
      prisma.experience.findUnique.mockResolvedValue(null);
      i18n.t.mockResolvedValue('Not Found');

      await expect(service.getExperienceById('u1', 'e1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if userId mismatch', async () => {
      prisma.experience.findUnique.mockResolvedValue({ id: 'e1', userId: 'other' } as any);
      i18n.t.mockResolvedValue('Not Found');

      await expect(service.getExperienceById('u1', 'e1')).rejects.toThrow(NotFoundException);
    });

    it('should return experience if owner', async () => {
      const exp = { id: 'e1', userId: 'u1' };
      prisma.experience.findUnique.mockResolvedValue(exp as any);
      (ExperienceFactory.fromPrisma as jest.Mock).mockReturnValue(exp);

      const result = await service.getExperienceById('u1', 'e1');
      expect(result.data).toEqual(exp);
    });
  });

  describe('updateExperience', () => {
    it('should update successfully and invalidate cache', async () => {
      const existing = { id: 'e1', userId: 'u1', cvId: 'cv1' };
      prisma.experience.findUnique.mockResolvedValue(existing as any);
      prisma.experience.update.mockResolvedValue({ ...existing, jobTitle: 'Updated' } as any);
      cvService.getById.mockResolvedValue({ data: { id: 'cv1' } } as any);
      (ExperienceFactory.fromPrisma as jest.Mock).mockReturnValue({ ...existing, jobTitle: 'Updated' });

      const result = await service.updateExperience('u1', 'e1', { jobTitle: 'Updated' });

      expect(prisma.experience.update).toHaveBeenCalled();
      expect(cvService.invalidateCache).toHaveBeenCalled();
      expect(result.data.jobTitle).toBe('Updated');
    });

    it('should validate new cvId if provided', async () => {
      const existing = { id: 'e1', userId: 'u1', cvId: 'cv1' };
      prisma.experience.findUnique.mockResolvedValue(existing as any);
      prisma.experience.update.mockResolvedValue({ ...existing, cvId: 'cv2' } as any);
      cvService.getById.mockResolvedValue({ data: { id: 'cv2' } } as any);

      await service.updateExperience('u1', 'e1', { cvId: 'cv2' });

      expect(cvService.getById).toHaveBeenCalledWith('cv2');
    });
  });

  describe('deleteExperience', () => {
    it('should delete and invalidate cache', async () => {
      const existing = { id: 'e1', userId: 'u1', cvId: 'cv1' };
      prisma.experience.findUnique.mockResolvedValue(existing as any);
      (ExperienceFactory.fromPrisma as jest.Mock).mockReturnValue(existing);
      cvService.getById.mockResolvedValue({ data: { id: 'cv1' } } as any);
      i18n.t.mockResolvedValue('Deleted');

      const result = await service.deleteExperience('u1', 'e1');

      expect(prisma.experience.delete).toHaveBeenCalledWith({ where: { id: 'e1' } });
      expect(cvService.invalidateCache).toHaveBeenCalled();
      expect(result.message).toBe('Deleted');
    });
  });
});

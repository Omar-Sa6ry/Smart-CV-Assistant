import { Test, TestingModule } from '@nestjs/testing';
import { AwardService } from './award.service';
import { PrismaService } from 'src/common/database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CvService } from '../cv/cv.service';
import { AwardBuilderFactory } from './builder/award-builder.factory';
import { AwardFactory } from './factory/award.factory';
import { NotFoundException, BadRequestException } from '@nestjs/common';

jest.mock('./factory/award.factory');

describe('AwardService', () => {
  let service: AwardService;
  let prisma: jest.Mocked<PrismaService>;
  let i18n: jest.Mocked<I18nService>;
  let cvService: jest.Mocked<CvService>;
  let builderFactory: jest.Mocked<AwardBuilderFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AwardService,
        {
          provide: PrismaService,
          useValue: {
            award: {
              create: jest.fn(),
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            cv: {
              update: jest.fn(),
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
          provide: AwardBuilderFactory,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AwardService>(AwardService);
    prisma = module.get(PrismaService);
    i18n = module.get(I18nService);
    cvService = module.get(CvService);
    builderFactory = module.get(AwardBuilderFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createAward', () => {
    const userId = 'user-1';
    const createDto = {
      title: 'Top Developer',
      issuer: 'Tech Academy',
      cvId: 'cv-1',
      issueDate: '2024-01-01',
      description: 'First place',
    };

    it('should create an award successfully and update CV', async () => {
      cvService.getById.mockResolvedValue({ data: { id: 'cv-1' } } as any);
      
      const builderMock = {
        setTitle: jest.fn().mockReturnThis(),
        setIssuer: jest.fn().mockReturnThis(),
        setIssueDate: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setUser: jest.fn().mockReturnThis(),
        setCv: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({ ...createDto, userId, issueDate: new Date(createDto.issueDate) }),
      };
      builderFactory.create.mockReturnValue(builderMock as any);

      const createdAward = { id: 'award-1', ...createDto, userId, issueDate: new Date(createDto.issueDate) };
      prisma.award.create.mockResolvedValue(createdAward as any);
      (AwardFactory.fromPrisma as jest.Mock).mockReturnValue(createdAward);
      i18n.t.mockResolvedValue('Created');

      const result = await service.createAward(userId, createDto as any);

      expect(result.data).toEqual(createdAward);
      expect(cvService.getById).toHaveBeenCalledWith(createDto.cvId, userId);
      expect(prisma.cv.update).toHaveBeenCalledWith({
        where: { id: createDto.cvId },
        data: { updatedAt: expect.any(Date) },
      });
      expect(cvService.invalidateCache).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid date formats', async () => {
      cvService.getById.mockResolvedValue({ data: { id: 'cv-1' } } as any);
      const invalidDto = { ...createDto, issueDate: 'invalid-date' };

      await expect(service.createAward(userId, invalidDto as any)).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateAward', () => {
    it('should update successfully and touch CV', async () => {
      const userId = 'user-1';
      const awardId = 'award-1';
      const updateDto = { title: 'New Title' };
      const existing = { id: awardId, userId, cvId: 'cv-1' };

      prisma.award.findUnique.mockResolvedValue(existing as any);
      prisma.award.update.mockResolvedValue({ ...existing, ...updateDto } as any);
      cvService.getById.mockResolvedValue({ data: { id: 'cv-1' } } as any);
      (AwardFactory.fromPrisma as jest.Mock).mockReturnValue({ ...existing, ...updateDto });
      i18n.t.mockResolvedValue('Updated');

      const result = await service.updateAward(userId, awardId, updateDto as any);

      expect(result.data.title).toBe('New Title');
      expect(prisma.cv.update).toHaveBeenCalledWith({
        where: { id: 'cv-1' },
        data: { updatedAt: expect.any(Date) },
      });
      expect(cvService.invalidateCache).toHaveBeenCalled();
    });

    it('should throw NotFoundException if award not found', async () => {
      prisma.award.findUnique.mockResolvedValue(null);
      i18n.t.mockResolvedValue('Not Found');

      await expect(service.updateAward('u1', 'a1', { title: 'T' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteAward', () => {
    it('should delete and touch CV', async () => {
      const userId = 'u1';
      const awardId = 'a1';
      const existing = { id: awardId, userId, cvId: 'cv1' };

      prisma.award.findUnique.mockResolvedValue(existing as any);
      (AwardFactory.fromPrisma as jest.Mock).mockReturnValue(existing);
      cvService.getById.mockResolvedValue({ data: { id: 'cv1' } } as any);
      i18n.t.mockResolvedValue('Deleted');

      const result = await service.deleteAward(userId, awardId);

      expect(prisma.award.delete).toHaveBeenCalledWith({ where: { id: awardId } });
      expect(prisma.cv.update).toHaveBeenCalledWith({
        where: { id: 'cv1' },
        data: { updatedAt: expect.any(Date) },
      });
      expect(result.message).toBe('Deleted');
    });
  });

  describe('getAwardsByCvId', () => {
    it('should return paginated awards', async () => {
      const userId = 'u1';
      const cvId = 'cv1';
      const awards = [{ id: 'a1' }];
      prisma.$transaction.mockResolvedValue([awards, 1]);
      (AwardFactory.fromPrismaArray as jest.Mock).mockReturnValue(awards);

      const result = await service.getAwardsByCvId(userId, cvId, { page: 1, limit: 10 });

      expect(result.items).toEqual(awards);
      expect(result.pagination.totalItems).toBe(1);
    });
  });

  describe('getAwardsByUserId', () => {
    it('should return paginated awards for user', async () => {
      const userId = 'u1';
      const awards = [{ id: 'a1' }];
      prisma.$transaction.mockResolvedValue([awards, 1]);
      (AwardFactory.fromPrismaArray as jest.Mock).mockReturnValue(awards);

      const result = await service.getAwardsByUserId(userId, { page: 1, limit: 10 });

      expect(result.items).toEqual(awards);
      expect(result.pagination.totalItems).toBe(1);
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { CvService } from './cv.service';
import { PrismaService } from 'src/common/database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { UserService } from 'src/modules/users/users.service';
import { RedisService } from '@bts-soft/core';
import { CvBuilderFactory } from './builder/cv-builder.factory';
import { NotFoundException } from '@nestjs/common';
import { CvFactory } from './factory/cv.factory';

jest.mock('./factory/cv.factory');

describe('CvService', () => {
  let service: CvService;
  let prisma: jest.Mocked<PrismaService>;
  let i18n: jest.Mocked<I18nService>;
  let userService: jest.Mocked<UserService>;
  let redisService: jest.Mocked<RedisService>;
  let builderFactory: jest.Mocked<CvBuilderFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CvService,
        {
          provide: PrismaService,
          useValue: {
            cv: {
              findMany: jest.fn(),
              count: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              updateMany: jest.fn(),
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
          provide: UserService,
          useValue: {
            findById: jest.fn(),
          },
        },
        {
          provide: RedisService,
          useValue: {
            get: jest.fn(),
            set: jest.fn(),
            update: jest.fn(),
            del: jest.fn(),
          },
        },
        {
          provide: CvBuilderFactory,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CvService>(CvService);
    prisma = module.get(PrismaService);
    i18n = module.get(I18nService);
    userService = module.get(UserService);
    redisService = module.get(RedisService);
    builderFactory = module.get(CvBuilderFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createCv', () => {
    const userId = 'user-1';
    const createDto = { title: 'New CV', summary: 'Summary', phone: '01091854368' };

    it('should throw NotFoundException if user not found', async () => {
      userService.findById.mockResolvedValue(null);
      i18n.t.mockResolvedValue('User not found');

      await expect(service.createCv(userId, createDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should create a CV successfully', async () => {
      const userData = { id: userId, email: 'test@test.com' };
      userService.findById.mockResolvedValue({ data: userData } as any);
      
      const builderMock = {
        setTitle: jest.fn().mockReturnThis(),
        setSummary: jest.fn().mockReturnThis(),
        setPhone: jest.fn().mockReturnThis(),
        setUser: jest.fn().mockReturnThis(),
        setIsDefault: jest.fn().mockReturnThis(),
        setLinkedin: jest.fn().mockReturnThis(),
        setPortfolio: jest.fn().mockReturnThis(),
        setGithub: jest.fn().mockReturnThis(),
        setLocation: jest.fn().mockReturnThis(),
        setHeadline: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({ ...createDto, userId, isDefault: true }),
      };
      builderFactory.create.mockReturnValue(builderMock as any);

      const createdCv = { id: 'cv-1', ...createDto, userId, isDefault: true };
      prisma.$transaction.mockImplementation(async (cb) => {
        if (typeof cb === 'function') {
          const tx = {
            cv: {
              updateMany: jest.fn().mockResolvedValue({ count: 1 }),
              create: jest.fn().mockResolvedValue(createdCv),
            },
          };
          return cb(tx);
        }
      });

      (CvFactory.fromPrisma as jest.Mock).mockReturnValue(createdCv);
      i18n.t.mockResolvedValue('CV Created');

      const result = await service.createCv(userId, { ...createDto, isDefault: true });

      expect(result.data).toEqual(createdCv);
      expect(redisService.set).toHaveBeenCalledWith(`cv:${createdCv.id}`, createdCv);
    });

    it('should create CV without updating others if isDefault is false', async () => {
      userService.findById.mockResolvedValue({ data: { id: userId } } as any);
      const builderMock = {
        setTitle: jest.fn().mockReturnThis(),
        setSummary: jest.fn().mockReturnThis(),
        setPhone: jest.fn().mockReturnThis(),
        setUser: jest.fn().mockReturnThis(),
        setIsDefault: jest.fn().mockReturnThis(),
        setLinkedin: jest.fn().mockReturnThis(),
        setPortfolio: jest.fn().mockReturnThis(),
        setGithub: jest.fn().mockReturnThis(),
        setLocation: jest.fn().mockReturnThis(),
        setHeadline: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({ ...createDto, userId, isDefault: false }),
      };
      builderFactory.create.mockReturnValue(builderMock as any);

      const createdCv = { id: 'cv-1', ...createDto, userId, isDefault: false };
      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          cv: {
            updateMany: jest.fn(),
            create: jest.fn().mockResolvedValue(createdCv),
          },
        };
        const res = await cb(tx);
        expect(tx.cv.updateMany).not.toHaveBeenCalled();
        return res;
      });

      await service.createCv(userId, createDto);
    });
  });

  describe('getUserCvs', () => {
    it('should return paginated CVs', async () => {
      const userId = 'user-1';
      const cvs = [{ id: 'cv-1', title: 'CV 1' }];
      const total = 1;

      prisma.$transaction.mockResolvedValue([cvs, total]);
      (CvFactory.fromPrismaArray as jest.Mock).mockReturnValue(cvs);

      const result = await service.getUserCvs(userId, { page: 1, limit: 10 });

      expect(result.items).toEqual(cvs);
      expect(result.pagination?.totalItems).toBe(total);
      expect(prisma.cv.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId },
        skip: 0,
        take: 10,
      }));
    });

    it('should use default pagination values if not provided', async () => {
      const userId = 'user-1';
      prisma.$transaction.mockResolvedValue([[], 0]);

      await service.getUserCvs(userId);

      expect(prisma.cv.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
      }));
    });
  });

  describe('getById', () => {
    const cvId = 'cv-1';
    const userId = 'user-1';

    it('should return from cache if exists and skipCache is false', async () => {
      const cachedCv = { id: cvId, title: 'Cached' };
      redisService.get.mockResolvedValue(cachedCv);

      const result = await service.getById(cvId);

      expect(result.data).toEqual(cachedCv);
      expect(prisma.cv.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from DB if cache miss', async () => {
      redisService.get.mockResolvedValue(null);
      const dbCv = { id: cvId, userId, title: 'DB' };
      prisma.cv.findUnique.mockResolvedValue(dbCv as any);
      (CvFactory.fromPrisma as jest.Mock).mockReturnValue(dbCv);

      const result = await service.getById(cvId);

      expect(result.data).toEqual(dbCv);
      expect(prisma.cv.findUnique).toHaveBeenCalled();
    });

    it('should throw NotFoundException if CV not found in DB', async () => {
      redisService.get.mockResolvedValue(null);
      prisma.cv.findUnique.mockResolvedValue(null);
      i18n.t.mockResolvedValue('Not found');

      await expect(service.getById(cvId)).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if CV belongs to another user', async () => {
      redisService.get.mockResolvedValue(null);
      prisma.cv.findUnique.mockResolvedValue({ id: cvId, userId: 'other' } as any);
      i18n.t.mockResolvedValue('Not found');

      await expect(service.getById(cvId, userId)).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateCv', () => {
    const userId = 'user-1';
    const cvId = 'cv-1';
    const updateDto = { title: 'Updated' };

    it('should update CV and cache', async () => {
      const updatedCv = { id: cvId, userId, ...updateDto };
      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          cv: {
            updateMany: jest.fn(),
            update: jest.fn().mockResolvedValue(updatedCv),
          },
        };
        return cb(tx);
      });
      (CvFactory.fromPrisma as jest.Mock).mockReturnValue(updatedCv);
      i18n.t.mockResolvedValue('Updated');

      const result = await service.updateCv(cvId, userId, updateDto);

      expect(result.data).toEqual(updatedCv);
      expect(redisService.update).toHaveBeenCalledWith(`cv:${cvId}`, updatedCv);
    });

    it('should handle isDefault update', async () => {
      prisma.$transaction.mockImplementation(async (cb) => {
        const tx = {
          cv: {
            updateMany: jest.fn().mockResolvedValue({ count: 1 }),
            update: jest.fn().mockResolvedValue({ id: cvId }),
          },
        };
        await cb(tx);
        expect(tx.cv.updateMany).toHaveBeenCalled();
        return { id: cvId };
      });

      await service.updateCv(cvId, userId, { isDefault: true });
    });
  });

  describe('deleteCv', () => {
    const userId = 'user-1';
    const cvId = 'cv-1';

    it('should delete CV and from cache', async () => {
      i18n.t.mockResolvedValue('Deleted');

      const result = await service.deleteCv(cvId, userId);

      expect(prisma.cv.delete).toHaveBeenCalledWith({
        where: { id: cvId, userId },
      });
      expect(redisService.del).toHaveBeenCalledWith(`cv:${cvId}`);
      expect(result.message).toBe('Deleted');
    });
  });

  describe('invalidateCache', () => {
    it('should call redis update', async () => {
      const data = { foo: 'bar' };
      await service.invalidateCache('cv-1', data);
      expect(redisService.update).toHaveBeenCalledWith('cv:cv-1', data);
    });
  });
});

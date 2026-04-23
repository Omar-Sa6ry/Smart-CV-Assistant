import { Test, TestingModule } from '@nestjs/testing';
import { SkillService } from './skill.service';
import { PrismaService } from 'src/common/database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CvService } from '../cv/cv.service';
import { SkillBuilderFactory } from './builder/skill-builder.factory';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SkillProficiency, SkillCategory } from '@prisma/client';

describe('SkillService', () => {
  let service: SkillService;
  let prisma: PrismaService;
  let i18n: I18nService;
  let cvService: CvService;
  let builderFactory: SkillBuilderFactory;

  const mockPrisma = {
    skill: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    skillKeyword: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key) => key),
  };

  const mockCvService = {
    getById: jest.fn(),
    invalidateCache: jest.fn(),
  };

  const mockBuilder = {
    setName: jest.fn().mockReturnThis(),
    setProficiency: jest.fn().mockReturnThis(),
    setUser: jest.fn().mockReturnThis(),
    setCv: jest.fn().mockReturnThis(),
    setKeyword: jest.fn().mockReturnThis(),
    build: jest.fn().mockReturnValue({}),
  };

  const mockBuilderFactory = {
    create: jest.fn().mockReturnValue(mockBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SkillService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: I18nService, useValue: mockI18n },
        { provide: CvService, useValue: mockCvService },
        { provide: SkillBuilderFactory, useValue: mockBuilderFactory },
      ],
    }).compile();

    service = module.get<SkillService>(SkillService);
    prisma = module.get<PrismaService>(PrismaService);
    i18n = module.get<I18nService>(I18nService);
    cvService = module.get<CvService>(CvService);
    builderFactory = module.get<SkillBuilderFactory>(SkillBuilderFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSkill', () => {
    const createDto = {
      cvId: 'cv-123',
      name: 'TypeScript',
      proficiency: SkillProficiency.expert,
    };
    const userId = 'user-123';

    it('should create a skill successfully with existing keyword', async () => {
      mockCvService.getById.mockResolvedValueOnce({ data: { id: 'cv-123' } }); 
      mockPrisma.skill.findFirst.mockResolvedValueOnce(null);
      mockPrisma.skillKeyword.findFirst.mockResolvedValueOnce({ id: 'kw-1', name: 'TypeScript' });
      mockPrisma.skill.create.mockResolvedValueOnce({ id: 'skill-1', ...createDto });
      mockCvService.getById.mockResolvedValueOnce({ data: { id: 'cv-123' } }); 

      const result = await service.createSkill(userId, createDto);

      expect(result.statusCode).toBe(201);
      expect(prisma.skillKeyword.update).toHaveBeenCalledWith({
        where: { id: 'kw-1' },
        data: { popularityScore: { increment: 1 } },
      });
      expect(cvService.invalidateCache).toHaveBeenCalled();
    });

    it('should create a skill and a new keyword if not exists', async () => {
      mockCvService.getById.mockResolvedValueOnce({ data: { id: 'cv-123' } });
      mockPrisma.skill.findFirst.mockResolvedValueOnce(null);
      mockPrisma.skillKeyword.findFirst.mockResolvedValueOnce(null);
      mockPrisma.skillKeyword.create.mockResolvedValueOnce({ id: 'new-kw', name: 'TypeScript' });
      mockPrisma.skill.create.mockResolvedValueOnce({ id: 'skill-1', ...createDto });
      mockCvService.getById.mockResolvedValueOnce({ data: { id: 'cv-123' } });

      await service.createSkill(userId, createDto);

      expect(prisma.skillKeyword.create).toHaveBeenCalled();
      expect(prisma.skill.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException if skill already exists in CV', async () => {
      mockCvService.getById.mockResolvedValueOnce({ data: { id: 'cv-123' } });
      mockPrisma.skill.findFirst.mockResolvedValueOnce({ id: 'existing-skill' });

      await expect(service.createSkill(userId, createDto)).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSkillsByUserId', () => {
    it('should return skills for a user', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([{ id: 'skill-1' }]);

      const result = await service.getSkillsByUserId('user-123');

      expect(result.items).toHaveLength(1);
      expect(result.statusCode).toBe(200);
    });
  });

  describe('getSkillsByCvId', () => {
    it('should return skills for a CV', async () => {
      mockPrisma.skill.findMany.mockResolvedValueOnce([{ id: 'skill-1' }]);

      const result = await service.getSkillsByCvId('user-123', 'cv-123');

      expect(result.items).toHaveLength(1);
    });
  });

  describe('getSkillById', () => {
    it('should return a skill if found and owned by user', async () => {
      mockPrisma.skill.findUnique.mockResolvedValueOnce({ id: 'skill-1', userId: 'user-123' });

      const result = await service.getSkillById('user-123', 'skill-1');

      expect(result.data).toBeDefined();
    });

    it('should throw NotFoundException if skill not found', async () => {
      mockPrisma.skill.findUnique.mockResolvedValueOnce(null);

      await expect(service.getSkillById('user-123', 'skill-1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if owned by another user', async () => {
      mockPrisma.skill.findUnique.mockResolvedValueOnce({ id: 'skill-1', userId: 'other-user' });

      await expect(service.getSkillById('user-123', 'skill-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('updateSkill', () => {
    const updateDto = { name: 'Updated' };

    it('should update skill and invalidate cache', async () => {
      jest.spyOn(service, 'getSkillById').mockResolvedValueOnce({ data: { id: 'skill-1' } } as any);
      mockPrisma.skill.update.mockResolvedValueOnce({ id: 'skill-1', cvId: 'cv-123' });
      mockCvService.getById.mockResolvedValueOnce({ data: { id: 'cv-123' } });

      const result = await service.updateSkill('user-123', 'skill-1', updateDto);

      expect(result.message).toBe('skill.UPDATED');
      expect(cvService.invalidateCache).toHaveBeenCalled();
    });
  });

  describe('deleteSkill', () => {
    it('should delete skill and invalidate cache', async () => {
      jest.spyOn(service, 'getSkillById').mockResolvedValueOnce({ data: { id: 'skill-1', cvId: 'cv-123' } } as any);
      mockCvService.getById.mockResolvedValueOnce({ data: { id: 'cv-123' } });

      const result = await service.deleteSkill('user-123', 'skill-1');

      expect(result.message).toBe('skill.DELETED');
      expect(prisma.skill.delete).toHaveBeenCalledWith({ where: { id: 'skill-1' } });
      expect(cvService.invalidateCache).toHaveBeenCalled();
    });
  });

  describe('searchKeywords', () => {
    it('should search keywords with pagination', async () => {
      mockPrisma.skillKeyword.findMany.mockResolvedValueOnce([{ id: 'kw-1', name: 'TS' }]);

      const result = await service.searchKeywords({ query: 'TS' }, { page: 1, limit: 10 });

      expect(result.items).toHaveLength(1);
      expect(prisma.skillKeyword.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { name: { contains: 'TS', mode: 'insensitive' } },
        take: 10,
        skip: 0,
      }));
    });

    it('should use default pagination if not provided', async () => {
      mockPrisma.skillKeyword.findMany.mockResolvedValueOnce([]);

      await service.searchKeywords({ query: 'TS' });

      expect(prisma.skillKeyword.findMany).toHaveBeenCalledWith(expect.objectContaining({
        take: 10,
        skip: 0,
      }));
    });
  });
});

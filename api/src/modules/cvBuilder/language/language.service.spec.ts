import { Test, TestingModule } from '@nestjs/testing';
import { LanguageService } from './language.service';
import { PrismaService } from 'src/common/database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CvService } from '../cv/cv.service';
import { LanguageBuilderFactory } from './builder/language-builder.factory';
import { StandardLanguageBuilder } from './builder/standard-language.builder';
import { Proficiency } from '@prisma/client';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('LanguageService', () => {
  let service: LanguageService;
  let prisma: PrismaService;
  let cvService: CvService;
  let i18n: I18nService;

  const mockPrisma = {
    language: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockCvService = {
    getById: jest.fn(),
    invalidateCache: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key) => key),
  };

  const mockBuilderFactory = {
    create: jest.fn().mockReturnValue(new StandardLanguageBuilder()),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LanguageService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: CvService, useValue: mockCvService },
        { provide: I18nService, useValue: mockI18n },
        { provide: LanguageBuilderFactory, useValue: mockBuilderFactory },
      ],
    }).compile();

    service = module.get<LanguageService>(LanguageService);
    prisma = module.get<PrismaService>(PrismaService);
    cvService = module.get<CvService>(CvService);
    i18n = module.get<I18nService>(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createLanguage', () => {
    const createInput = {
      cvId: 'cv-1',
      name: 'English',
      proficiency: Proficiency.fluent,
    };

    it('should create language successfully', async () => {
      mockCvService.getById.mockResolvedValue({ data: { id: 'cv-1' } });
      mockPrisma.language.findFirst.mockResolvedValue(null);
      mockPrisma.language.create.mockResolvedValue({
        id: 'lang-1',
        ...createInput,
        userId: 'user-1',
      });

      const result = await service.createLanguage('user-1', createInput);

      expect(result.statusCode).toBe(201);
      expect(result.data.name).toBe('English');
      expect(mockCvService.invalidateCache).toHaveBeenCalled();
    });

    it('should throw BadRequestException if language already exists in CV', async () => {
      mockCvService.getById.mockResolvedValue({ data: { id: 'cv-1' } });
      mockPrisma.language.findFirst.mockResolvedValue({ id: 'existing' });

      await expect(service.createLanguage('user-1', createInput)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('getLanguagesByUserId', () => {
    it('should return all languages for a user', async () => {
      mockPrisma.language.findMany.mockResolvedValue([{ id: 'l1' }, { id: 'l2' }]);

      const result = await service.getLanguagesByUserId('user-1');

      expect(result.items).toHaveLength(2);
      expect(mockPrisma.language.findMany).toHaveBeenCalledWith({
        where: { userId: 'user-1' },
      });
    });
  });

  describe('getLanguageById', () => {
    it('should return language if it exists and belongs to user', async () => {
      const mockLang = { id: 'l1', userId: 'user-1', name: 'English' };
      mockPrisma.language.findUnique.mockResolvedValue(mockLang);

      const result = await service.getLanguageById('user-1', 'l1');

      expect(result.data.id).toBe('l1');
    });

    it('should throw NotFoundException if language not found', async () => {
      mockPrisma.language.findUnique.mockResolvedValue(null);

      await expect(service.getLanguageById('user-1', 'l1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if language belongs to another user', async () => {
      mockPrisma.language.findUnique.mockResolvedValue({ id: 'l1', userId: 'other' });

      await expect(service.getLanguageById('user-1', 'l1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('updateLanguage', () => {
    it('should update language successfully', async () => {
      const updateInput = { name: 'English Updated', proficiency: Proficiency.native };
      mockPrisma.language.findUnique.mockResolvedValue({ id: 'l1', userId: 'u1' });
      mockPrisma.language.update.mockResolvedValue({ 
        id: 'l1', 
        cvId: 'c1', 
        ...updateInput 
      });
      mockCvService.getById.mockResolvedValue({ data: { id: 'c1' } });

      const result = await service.updateLanguage('u1', 'l1', updateInput);

      expect(result.data.name).toBe('English Updated');
      expect(mockCvService.invalidateCache).toHaveBeenCalled();
    });
  });

  describe('deleteLanguage', () => {
    it('should delete language successfully', async () => {
      mockPrisma.language.findUnique.mockResolvedValue({ id: 'l1', userId: 'u1', cvId: 'c1' });
      mockCvService.getById.mockResolvedValue({ data: { id: 'c1' } });

      const result = await service.deleteLanguage('u1', 'l1');

      expect(result.message).toBe('language.DELETED');
      expect(mockPrisma.language.delete).toHaveBeenCalledWith({ where: { id: 'l1' } });
      expect(mockCvService.invalidateCache).toHaveBeenCalled();
    });
  });
});

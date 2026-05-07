import { Test, TestingModule } from '@nestjs/testing';
import { ProjectService } from './project.service';
import { PrismaService } from 'src/common/database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { CvService } from '../cv/cv.service';
import { ProjectBuilderFactory } from './builder/project-builder.factory';
import { ProjectFactory } from './factory/project.factory';
import { NotFoundException } from '@nestjs/common';

jest.mock('./factory/project.factory');

describe('ProjectService', () => {
  let service: ProjectService;
  let prisma: jest.Mocked<PrismaService>;
  let i18n: jest.Mocked<I18nService>;
  let cvService: jest.Mocked<CvService>;
  let builderFactory: jest.Mocked<ProjectBuilderFactory>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProjectService,
        {
          provide: PrismaService,
          useValue: {
            project: {
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
          provide: ProjectBuilderFactory,
          useValue: {
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProjectService>(ProjectService);
    prisma = module.get(PrismaService);
    i18n = module.get(I18nService);
    cvService = module.get(CvService);
    builderFactory = module.get(ProjectBuilderFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    const userId = 'user-1';
    const createDto = {
      name: 'Project 1',
      description: 'Desc 1',
      projectUrl: 'https://project.com',
      cvId: 'cv-1',
      startDate: new Date(),
    };

    it('should create project successfully', async () => {
      cvService.getById.mockResolvedValue({ data: { id: 'cv-1' } } as any);
      
      const builderMock = {
        setName: jest.fn().mockReturnThis(),
        setDescription: jest.fn().mockReturnThis(),
        setProjectUrl: jest.fn().mockReturnThis(),
        setStartDate: jest.fn().mockReturnThis(),
        setEndDate: jest.fn().mockReturnThis(),
        setUser: jest.fn().mockReturnThis(),
        setCv: jest.fn().mockReturnThis(),
        build: jest.fn().mockReturnValue({ ...createDto, userId }),
      };
      builderFactory.create.mockReturnValue(builderMock as any);

      const createdProject = { id: 'proj-1', ...createDto, userId };
      prisma.project.create.mockResolvedValue(createdProject as any);
      (ProjectFactory.fromPrisma as jest.Mock).mockReturnValue(createdProject);
      i18n.t.mockResolvedValue('Created');

      const result = await service.createProject(userId, createDto as any);

      expect(result.data).toEqual(createdProject);
      expect(cvService.getById).toHaveBeenCalledWith(createDto.cvId, userId);
      expect(cvService.invalidateCache).toHaveBeenCalled();
    });
  });

  describe('getProjectsByUserId', () => {
    it('should return paginated projects', async () => {
      const userId = 'user-1';
      const projects = [{ id: 'proj-1' }];
      prisma.$transaction.mockResolvedValue([projects, 1]);
      (ProjectFactory.fromPrismaArray as jest.Mock).mockReturnValue(projects);

      const result = await service.getProjectsByUserId(userId, { page: 1, limit: 10 });

      expect(result.items).toEqual(projects);
      expect(result.pagination.totalItems).toBe(1);
      expect(prisma.project.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { userId },
        skip: 0,
        take: 10,
      }));
    });

    it('should use default pagination if not provided', async () => {
      const userId = 'user-1';
      prisma.$transaction.mockResolvedValue([[], 0]);
      (ProjectFactory.fromPrismaArray as jest.Mock).mockReturnValue([]);

      await service.getProjectsByUserId(userId);

      expect(prisma.project.findMany).toHaveBeenCalledWith(expect.objectContaining({
        skip: 0,
        take: 10,
      }));
    });
  });

  describe('getProjectsByCvId', () => {
    it('should return paginated projects for a CV', async () => {
      const userId = 'user-1';
      const cvId = 'cv-1';
      const projects = [{ id: 'proj-1' }];
      prisma.$transaction.mockResolvedValue([projects, 1]);
      (ProjectFactory.fromPrismaArray as jest.Mock).mockReturnValue(projects);

      const result = await service.getProjectsByCvId(userId, cvId);

      expect(result.items).toEqual(projects);
      expect(prisma.project.findMany).toHaveBeenCalledWith(expect.objectContaining({
        where: { cvId, userId },
      }));
    });
  });

  describe('getProjectById', () => {
    it('should throw NotFoundException if project not found', async () => {
      prisma.project.findUnique.mockResolvedValue(null);
      i18n.t.mockResolvedValue('Not Found');

      await expect(service.getProjectById('u1', 'p1')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if userId mismatch', async () => {
      prisma.project.findUnique.mockResolvedValue({ id: 'p1', userId: 'other' } as any);
      i18n.t.mockResolvedValue('Not Found');

      await expect(service.getProjectById('u1', 'p1')).rejects.toThrow(NotFoundException);
    });

    it('should return project if owner', async () => {
      const project = { id: 'p1', userId: 'u1' };
      prisma.project.findUnique.mockResolvedValue(project as any);
      (ProjectFactory.fromPrisma as jest.Mock).mockReturnValue(project);

      const result = await service.getProjectById('u1', 'p1');
      expect(result.data).toEqual(project);
    });
  });

  describe('updateProject', () => {
    it('should update successfully and invalidate cache', async () => {
      const existing = { id: 'p1', userId: 'u1', cvId: 'cv1' };
      prisma.project.findUnique.mockResolvedValue(existing as any);
      prisma.project.update.mockResolvedValue({ ...existing, name: 'Updated' } as any);
      cvService.getById.mockResolvedValue({ data: { id: 'cv1' } } as any);
      (ProjectFactory.fromPrisma as jest.Mock).mockReturnValue({ ...existing, name: 'Updated' });
      i18n.t.mockResolvedValue('Updated');

      const result = await service.updateProject('u1', 'p1', { name: 'Updated' });

      expect(prisma.project.update).toHaveBeenCalled();
      expect(cvService.invalidateCache).toHaveBeenCalled();
      expect(result.data.name).toBe('Updated');
    });
  });

  describe('deleteProject', () => {
    it('should delete and invalidate cache', async () => {
      const existing = { id: 'p1', userId: 'u1', cvId: 'cv1' };
      prisma.project.findUnique.mockResolvedValue(existing as any);
      (ProjectFactory.fromPrisma as jest.Mock).mockReturnValue(existing);
      cvService.getById.mockResolvedValue({ data: { id: 'cv1' } } as any);
      i18n.t.mockResolvedValue('Deleted');

      const result = await service.deleteProject('u1', 'p1');

      expect(prisma.project.delete).toHaveBeenCalledWith({ where: { id: 'p1' } });
      expect(cvService.invalidateCache).toHaveBeenCalled();
      expect(result.message).toBe('Deleted');
    });
  });
});

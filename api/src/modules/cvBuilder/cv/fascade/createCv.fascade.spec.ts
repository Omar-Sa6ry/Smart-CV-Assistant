import { Test, TestingModule } from '@nestjs/testing';
import { CreateCvFascade } from './createCv.fascade';
import { CvBuilderFactory } from '../builder/cv-builder.factory';
import { PrismaService } from 'src/common/database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { UserService } from 'src/modules/users/users.service';
import { RedisService } from '@bts-soft/core';
import { NotFoundException } from '@nestjs/common';
import {
  CreateCertificationNestedInput,
  CreateEducationNestedInput,
  CreateExperienceNestedInput,
  CreateFullCvInput,
  CreateLanguageNestedInput,
  CreateProjectNestedInput,
  CreateSkillNestedInput,
} from '../inputs/createFullCv.input';
import { CvFactory } from '../factory/cv.factory';
import { CreateExperienceInput } from '../../experience/inputs/createExperience.input';
import {
  EmploymentType,
  SkillCategory,
  SkillProficiency,
} from '@prisma/client';

jest.mock('../factory/cv.factory', () => ({
  CvFactory: {
    fromPrisma: jest.fn().mockReturnValue({ id: 'cv-123', title: 'Test CV' }),
  },
}));

describe('CreateCvFascade', () => {
  let fascade: CreateCvFascade;
  let builderFactory: jest.Mocked<CvBuilderFactory>;
  let prisma: jest.Mocked<PrismaService>;
  let i18n: jest.Mocked<I18nService>;
  let userService: jest.Mocked<UserService>;
  let redisService: jest.Mocked<RedisService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateCvFascade,
        {
          provide: CvBuilderFactory,
          useValue: {
            create: jest.fn(),
          },
        },
        {
          provide: PrismaService,
          useValue: {
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
            set: jest.fn(),
          },
        },
      ],
    }).compile();

    fascade = module.get<CreateCvFascade>(CreateCvFascade);
    builderFactory = module.get(CvBuilderFactory);
    prisma = module.get(PrismaService);
    i18n = module.get(I18nService);
    userService = module.get(UserService);
    redisService = module.get(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createFullCv', () => {
    const userId = 'user-123';
    const experiencesMock: CreateExperienceNestedInput[] = [
      {
        jobTitle: 'Backend Developer',
        companyName: 'tamooh',
        companyWebsite: 'https://tamooh.cloud/',
        location: 'Portaid, Egypt',
        isCurrentJob: true,
        employmentType: EmploymentType.full_time,
        startDate: new Date('2025-10-01'),
        description: 'description',
      },
    ];

    const educationsMock: CreateEducationNestedInput[] = [
      {
        institution: 'Damietta unversity',
        title: 'Bachelor of Computer Science and Artificial Intelligence',
        location: 'Damieta, university',
        description: 'Bachelor of Computer Science and Artificial Intelligence',
        degree: 'bachelor',
        isCurrent: true,
        gpa: 3.5,
        startDate: new Date('2025-10-01'),
      },
    ];

    const projectsMock: CreateProjectNestedInput[] = [
      {
        name: 'bidding',
        description: 'bidding',
        projectUrl: 'https://tamooh.cloud/',
        startDate: new Date('2025-10-01'),
      },
    ];

    const certificationsMock: CreateCertificationNestedInput[] = [
      {
        name: 'gRPC [Golang] Master Class: Build Modern API & Microservices',
        issuingOrganization: 'udemy',
        credentialId: 'klkjhjuio',
        credentialUrl: 'https://tamooh.cloud/',
        issueDate: new Date('2025-10-05'),
      },
    ];

    const languagesMock: CreateLanguageNestedInput[] = [
      {
        name: 'English',
        proficiency: 'Native',
      },
    ];

    const skillsMock: CreateSkillNestedInput[] = [
      {
        name: 'node.js',
        proficiency: SkillProficiency.intermediate,
        category: SkillCategory.technical,
      },
      {
        name: 'NestJS',
        proficiency: SkillProficiency.intermediate,
        category: SkillCategory.technical,
      },
    ];

    const mockFullCvInput: CreateFullCvInput = {
      headline: 'Backend Developer',
      summary: 'summary',
      title: 'CV Title',
      phone: '1234567890',
      linkedin: 'linkedin.com/in/user',
      portfolio: 'portfolio.com',
      github: 'github.com/user',
      location: 'Location',
      isDefault: true,
      experiences: experiencesMock,
      educations: educationsMock,
      projects: projectsMock,
      certifications: certificationsMock,
      languages: languagesMock,
      skills: skillsMock,
    };

    const mockBuiltCvFields = {
      title: 'CV Title',
      headline: 'Backend Developer',
      summary: 'summary',
      phone: '1234567890',
      linkedin: 'linkedin.com/in/user',
      portfolio: 'portfolio.com',
      github: 'github.com/user',
      location: 'Location',
      isDefault: true,
      userId,
    };

    let mockTx: any;

    beforeEach(() => {
      // Mock User validation
      userService.findById.mockResolvedValue({ data: { id: userId } } as any);

      // Mock Builder
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
        build: jest.fn().mockReturnValue(mockBuiltCvFields),
      };
      builderFactory.create.mockReturnValue(builderMock as any);

      prisma.$transaction.mockImplementation(async (callback) => {
        return await callback(mockTx);
      });

      i18n.t.mockImplementation(async (key) => `translated-${key}`);

      mockTx = {
        cv: {
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
          create: jest.fn().mockResolvedValue({ id: 'cv-123' }),
          findUnique: jest.fn().mockResolvedValue({
            id: 'cv-123',
            userId,
            experiences: [],
            educations: [],
            certifications: [],
            projects: [],
            languages: [],
            skills: [],
          }),
        },
        experience: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
        education: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
        project: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
        certification: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
        language: { createMany: jest.fn().mockResolvedValue({ count: 1 }) },
        skillKeyword: {
          findMany: jest
            .fn()
            .mockResolvedValue([
              { id: 'kw-1', name: 'Node.js', popularityScore: 10 },
            ]),
          update: jest.fn().mockResolvedValue({
            id: 'kw-1',
            name: 'Node.js',
            popularityScore: 11,
          }),
          create: jest.fn().mockResolvedValue({
            id: 'kw-2',
            name: 'NestJS',
            popularityScore: 1,
          }),
        },
        skill: {
          createMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };
    });

    it('should throw NotFoundException if user does not exist', async () => {
      userService.findById.mockResolvedValue(null);

      await expect(
        fascade.createFullCv(userId, mockFullCvInput),
      ).rejects.toThrow(NotFoundException);
      expect(userService.findById).toHaveBeenCalledWith(userId);
    });

    it('should throw NotFoundException if user.data is empty', async () => {
      userService.findById.mockResolvedValue({ data: null } as any);

      await expect(
        fascade.createFullCv(userId, mockFullCvInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a full CV successfully and cache it', async () => {
      const result = await fascade.createFullCv(userId, mockFullCvInput);

      expect(userService.findById).toHaveBeenCalledWith(userId);

      expect(builderFactory.create).toHaveBeenCalled();
      expect(prisma.$transaction).toHaveBeenCalled();

      expect(mockTx.cv.updateMany).toHaveBeenCalledWith({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });

      expect(mockTx.cv.create).toHaveBeenCalledWith({
        data: mockBuiltCvFields,
      });

      expect(mockTx.experience.createMany).toHaveBeenCalled();
      expect(mockTx.education.createMany).toHaveBeenCalled();
      expect(mockTx.project.createMany).toHaveBeenCalled();
      expect(mockTx.certification.createMany).toHaveBeenCalled();
      expect(mockTx.language.createMany).toHaveBeenCalled();

      expect(mockTx.skillKeyword.findMany).toHaveBeenCalled();
      expect(mockTx.skillKeyword.update).toHaveBeenCalledWith({
        where: { id: 'kw-1' },
        data: { popularityScore: { increment: 1 } },
      });
      expect(mockTx.skillKeyword.create).toHaveBeenCalledWith({
        data: { name: 'NestJS', isVerified: false, popularityScore: 1 },
      });
      expect(mockTx.skill.createMany).toHaveBeenCalled();

      expect(mockTx.cv.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'cv-123' },
          include: expect.any(Object),
        }),
      );

      expect(redisService.set).toHaveBeenCalledWith(
        'cv:cv-123',
        expect.any(Object),
      );
      expect(result).toEqual({
        data: expect.any(Object),
        statusCode: 201,
        message: 'translated-cv.CREATED',
      });
    });

    it('should not update previous default CVs if isDefault is false', async () => {
      const inputWithoutDefault = { ...mockFullCvInput, isDefault: false };
      const builderMock = builderFactory.create();
      (builderMock.build as jest.Mock).mockReturnValueOnce({
        ...mockBuiltCvFields,
        isDefault: false,
      });

      await fascade.createFullCv(userId, inputWithoutDefault);

      expect(mockTx.cv.updateMany).not.toHaveBeenCalled();
    });

    it('should not process relations if they are empty or undefined', async () => {
      const inputWithoutRelations = { title: 'Backend Developer' };

      await fascade.createFullCv(userId, inputWithoutRelations);

      expect(mockTx.experience.createMany).not.toHaveBeenCalled();
      expect(mockTx.education.createMany).not.toHaveBeenCalled();
      expect(mockTx.project.createMany).not.toHaveBeenCalled();
      expect(mockTx.certification.createMany).not.toHaveBeenCalled();
      expect(mockTx.language.createMany).not.toHaveBeenCalled();
      expect(mockTx.skillKeyword.findMany).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if fetchFullCv returns null after creation', async () => {
      mockTx.cv.findUnique.mockResolvedValue(null);

      await expect(
        fascade.createFullCv(userId, mockFullCvInput),
      ).rejects.toThrow(NotFoundException);
      expect(i18n.t).toHaveBeenCalledWith('cv.NOT_FOUND');
    });

    it('should default missing description in experiences and educations to empty string', async () => {
      const inputWithMissingDesc = {
        title: 'Title',
        experiences: [{ company: 'Test' }],
        educations: [{ degree: 'Test' }],
      };

      await fascade.createFullCv(userId, inputWithMissingDesc);

      expect(mockTx.experience.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ description: '' })],
      });
      expect(mockTx.education.createMany).toHaveBeenCalledWith({
        data: [expect.objectContaining({ description: '' })],
      });
    });
  });
});
